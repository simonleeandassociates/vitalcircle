import { supabase } from '../lib/supabase'

// Excludes visually ambiguous characters: 0/O, 1/I/L
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode() {
  return Array.from(
    { length: 6 },
    () => INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]
  ).join('')
}

/**
 * Returns the current user's group membership status.
 * For family members, also fetches the senior's name.
 * Returns { hasGroup, groupId, role, groupName, inviteCode, seniorName }.
 */
export async function getUserGroupStatus(userId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('group_id, role, family_groups(name, invite_code)')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return {
      hasGroup: false,
      groupId: null,
      role: null,
      groupName: null,
      inviteCode: null,
      seniorName: null,
    }
  }

  let seniorName = null
  if (data.role === 'family') {
    const { data: seniorMember } = await supabase
      .from('family_members')
      .select('users(name)')
      .eq('group_id', data.group_id)
      .eq('role', 'senior')
      .maybeSingle()
    seniorName = seniorMember?.users?.name ?? null
  }

  return {
    hasGroup:   true,
    groupId:    data.group_id,
    role:       data.role,
    groupName:  data.family_groups?.name ?? null,
    inviteCode: data.family_groups?.invite_code ?? null,
    seniorName,
  }
}

/**
 * Looks up a family group by invite code.
 * Returns { valid, groupId, groupName }.
 */
export async function validateInviteCode(code) {
  const { data, error } = await supabase
    .from('family_groups')
    .select('id, name')
    .eq('invite_code', code.trim().toUpperCase())
    .maybeSingle()

  if (error) throw error
  if (!data) return { valid: false, groupId: null, groupName: null }
  return { valid: true, groupId: data.id, groupName: data.name }
}

/**
 * Creates a new family group for a senior, inserts them into family_members.
 * Idempotent: returns existing group if the senior already has one.
 * Returns { groupId, inviteCode }.
 */
export async function createGroupForSenior(userId) {
  const existing = await getUserGroupStatus(userId)
  if (existing.hasGroup) {
    return { groupId: existing.groupId, inviteCode: existing.inviteCode }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode()

    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .insert({ name: 'My Family', invite_code: code })
      .select()
      .single()

    if (groupError) {
      // 23505 = unique_violation on invite_code — retry with a new code
      if (groupError.code === '23505') continue
      throw groupError
    }

    const { error: memberError } = await supabase
      .from('family_members')
      .insert({ user_id: userId, group_id: group.id, role: 'senior' })
    if (memberError) throw memberError

    return { groupId: group.id, inviteCode: code }
  }

  throw new Error('Could not generate a unique invite code. Please try again.')
}

/**
 * Adds a family member to a group using a 6-char invite code.
 * Returns { groupId }.
 */
export async function joinGroupWithCode(userId, code) {
  const { valid, groupId } = await validateInviteCode(code)
  if (!valid) throw new Error('Invalid invite code. Please check and try again.')

  const { error } = await supabase
    .from('family_members')
    .insert({ user_id: userId, group_id: groupId, role: 'family' })

  if (error) {
    if (error.code === '23505') throw new Error('You are already a member of this group.')
    throw error
  }

  return { groupId }
}
