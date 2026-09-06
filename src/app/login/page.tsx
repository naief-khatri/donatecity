import { login, signup, signInWithGoogle } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Outgive</CardTitle>
          <CardDescription>Log in or create an account to start building.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <form action={signInWithGoogle}>
              <button 
                type="submit" 
                className="w-full inline-flex items-center justify-center rounded-lg h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
              >
                Sign in with Google
              </button>
            </form>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or with email</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {params?.message && (
                <p className="text-sm text-red-500 text-center">{params.message}</p>
              )}
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  formAction={login} 
                  className="w-full inline-flex items-center justify-center rounded-lg h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
                >
                  Log In
                </button>
                <button 
                  type="submit" 
                  formAction={signup} 
                  className="w-full inline-flex items-center justify-center rounded-lg h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
