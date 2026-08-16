import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wmjowbcunxuhdeqgkcjw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtam93YmN1bnh1aGRlcWdrY2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODk0NTUsImV4cCI6MjEwMTM2NTQ1NX0.IdplwnQcUwkmZrQAt2n1jh3vjGKV2ABmY4fWleMgaUQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// AUTH HELPERS
export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// PROFILE HELPERS
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// TRANSACTIONS HELPERS
export async function getTransactions(userId, month = null) {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (month) {
    const start = `${month}-01`
    const end = `${month}-31`
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  return { data, error }
}

export async function addTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
  return { data, error }
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  return { error }
}

// GOALS HELPERS
export async function getGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function addGoal(goal) {
  const { data, error } = await supabase
    .from('goals')
    .insert([goal])
    .select()
  return { data, error }
}

export async function updateGoal(id, updates) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export async function deleteGoal(id) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
  return { error }
}

// MISSIONS HELPERS
export async function getMissions(userId) {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function completeMission(missionId, userId, xpReward) {
  const { error } = await supabase
    .from('missions')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', missionId)

  if (!error) {
    const { data: profile } = await getProfile(userId)
    if (profile) {
      await updateProfile(userId, { xp: (profile.xp || 0) + xpReward })
    }
  }
  return { error }
}

// BILLS HELPERS
export async function getBills(userId) {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .order('due_day', { ascending: true })
  return { data, error }
}

export async function addBill(bill) {
  const { data, error } = await supabase
    .from('bills')
    .insert([bill])
    .select()
  return { data, error }
}

export async function updateBill(id, updates) {
  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export async function deleteBill(id) {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)
  return { error }
}

// BUDGETS HELPERS
export async function getBudgets(userId, month) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
  return { data, error }
}

export async function upsertBudget(userId, month, category, amount) {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: userId, month, category, amount },
      { onConflict: 'user_id,month,category' }
    )
    .select()
  return { data, error }
}

export async function deleteBudget(userId, month, category) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('user_id', userId)
    .eq('month', month)
    .eq('category', category)
  return { error }
}

// DEBTS HELPERS
export async function getDebts(userId) {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('balance', { ascending: false })
  return { data, error }
}

export async function addDebt(debt) {
  const { data, error } = await supabase
    .from('debts')
    .insert([debt])
    .select()
  return { data, error }
}

export async function updateDebt(id, updates) {
  const { data, error } = await supabase
    .from('debts')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export async function deleteDebt(id) {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id)
  return { error }
}

export async function makeDebtPayment(debtId, userId, paymentAmount) {
  const { data: debt, error: fetchErr } = await supabase
    .from('debts')
    .select('balance, original_balance')
    .eq('id', debtId)
    .single()

  if (fetchErr || !debt) return { error: fetchErr || new Error('Deuda no encontrada') }

  const newBalance = Math.max(0, debt.balance - paymentAmount)
  const { data, error } = await supabase
    .from('debts')
    .update({ balance: newBalance })
    .eq('id', debtId)
    .select()

  if (!error) {
    await addTransaction({
      user_id: userId,
      type: 'expense',
      amount: paymentAmount,
      category: 'debt',
      note: 'Pago de deuda',
      date: new Date().toISOString().split('T')[0],
    })
    const { data: profile } = await getProfile(userId)
    if (profile) {
      await updateProfile(userId, { xp: (profile.xp || 0) + 25 })
    }
  }

  return { data, error, newBalance }
}
