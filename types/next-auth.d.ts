import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role?: string
      business_unit_group_id?: number
      group_name?: string
      auth_provider?: string
    }
  }

  interface User {
    id: string       
    role?: string
    business_unit_group_id?: number
    group_name?: string
    auth_provider?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    business_unit_group_id?: number
    group_name?: string
    auth_provider?: string
  }
}