export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { employeeId } = req.query

  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required' })
  }

  try {
    const response = await fetch(`http://10.35.10.47:2007/api/EmployeeCard/getDataDetailsCard?employeeId=${employeeId}`)
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch employee data' })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Employee lookup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
