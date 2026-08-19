import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function copyCookies(
  source: NextResponse,
  target: NextResponse
) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  return target
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value)
            }
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              )
            }
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (
    !user &&
    pathname.startsWith("/dashboard")
  ) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set(
      "redirect",
      pathname
    )

    return copyCookies(
      response,
      NextResponse.redirect(loginUrl)
    )
  }

  if (
    user &&
    pathname === "/login"
  ) {
    const dashboardUrl =
      request.nextUrl.clone()

    dashboardUrl.pathname = "/dashboard"
    dashboardUrl.search = ""

    return copyCookies(
      response,
      NextResponse.redirect(dashboardUrl)
    )
  }

  return response
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
  ],
}