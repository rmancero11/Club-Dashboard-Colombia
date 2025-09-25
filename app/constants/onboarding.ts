export const businessCategories = [
  {
    name: 'Alimentos y Bebidas',
    subcategories: [
      'Restaurantes',
      'Cafeterías',
      'Comida rápida',
      'Bares',
      'Panaderías',
      'Heladerías',
      'Supermercados',
      'Tiendas de comestibles',
      'Licorerías',
      'Tiendas especializadas en alimentos'
    ]
  },
  {
    name: 'Salud y Belleza',
    subcategories: [
      'Spa',
      'Salones de belleza',
      'Tiendas de productos de belleza'
    ]
  },
  {
    name: 'Shopping',
    subcategories: []
  },
  {
    name: 'Viajes y Turismo',
    subcategories: []
  },
  {
    name: 'Diversión',
    subcategories: []
  },
  {
    name: 'Electrónica y Tecnología',
    subcategories: []
  },
  {
    name: 'Hogar',
    subcategories: []
  },
  {
    name: 'Deportes',
    subcategories: []
  },
  {
    name: 'Autos',
    subcategories: []
  },
  {
    name: 'Libros y entretenimiento',
    subcategories: []
  }
]

// dictionary depending on average customers per business select according plan small, growth, premium, enterprise
/**
 *  *  plansByAverageCustomers = [
 *  {
 * min: 0,
 * max: 100,
 * name: 'small'
 * },
 * {
 * min: 101,
 * max: 500,
 * name: 'growth'
 * }
 * ]
 * 
 * example idealPlanByAvergeCustomers first use min and max value to get the plan and then get plan information
 * example idealPlanByAvergeCustomers(100) => {
    const plan = plansByAverageCustomers.find(({ min, max }) => averageCustomers >= min && averageCustomers <= max)
    return plan.name
 * 
 * } 
 * {
 *   plan: 'small',
 *  minCustomers: 0,
 * maxCustomers: 100
 * }
 * }
 */
export const plansByAverageCustomers = [
  {
    min: 0,
    max: 100,
    name: 'small'
  },
  {
    min: 101,
    max: 400,
    name: 'growth'
  },
  {
    min: 401,
    max: 800,
    name: 'premium'
  },
  {
    min: 801,
    max: 100000000,
    name: 'enterprise'
  }
]

export const getPlanByAverageCustomers = (averageCustomers: number) => {
  const plan = plansByAverageCustomers.find(({ min, max }) => averageCustomers >= min && averageCustomers <= max)
  if (!plan) throw new Error('Plan not found')
  return plan.name
}

export const getPlanInformation = (plan: string) => {
  const plans = {
    small: {
      name: 'Small',
      cost: 15,
      currency: {
        'EC': 'USD'
      }
    },
    growth: {
      name: 'Growth',
      cost: 39,
      currency: {
        'EC': 'USD'
      }
    },
    premium: {
      name: 'Premium',
      cost: 70,
      currency: {
        'EC': 'USD'
      }
    },
    enterprise: {
      name: 'Enterprise',
      cost: 0,
      currency: {
        'EC': 'USD'
      }
    }
  }
  return plans[plan as keyof typeof plans];
}

