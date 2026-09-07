import { login, signup } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0F4F8] selection:bg-[#FFD166] selection:text-black">
      
      {/* Playful background blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD166]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4285F4]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md p-8 bg-white border-4 border-[#1E1E24] rounded-[2rem] shadow-[8px_8px_0_0_#1E1E24] m-4">
        
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-[#FFD166] rounded-2xl border-4 border-[#1E1E24] shadow-[4px_4px_0_0_#1E1E24] mb-6 transform -rotate-2">
            <h1 className="text-4xl font-black tracking-tight text-[#1E1E24]">Donate City</h1>
          </div>
          <p className="text-lg font-medium text-[#64646F]">Build your city. Change the world.</p>
        </div>

        <div className="flex flex-col gap-6">
          <GoogleLoginButton />
          
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-[#E1E1E8]"></div>
            </div>
            <div className="relative bg-white px-4">
              <span className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider">Or play with email</span>
            </div>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#1E1E24]">Email address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="mayor@city.com"
                required 
                className="h-12 border-2 border-[#E1E1E8] rounded-xl focus-visible:ring-0 focus-visible:border-[#4285F4] text-lg px-4 bg-[#F8FAFC]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-[#1E1E24]">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••"
                required 
                className="h-12 border-2 border-[#E1E1E8] rounded-xl focus-visible:ring-0 focus-visible:border-[#4285F4] text-lg px-4 bg-[#F8FAFC]"
              />
            </div>

            {params?.message && (
              <div className="p-3 bg-[#FFE5E5] border-2 border-[#FF4A4A] rounded-xl text-center">
                <p className="text-sm font-bold text-[#FF4A4A]">{params.message}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                type="submit" 
                formAction={login} 
                className="w-full h-12 bg-white text-[#1E1E24] border-2 border-[#1E1E24] rounded-xl font-bold shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px] transition-all"
              >
                Log In
              </button>
              <button 
                type="submit" 
                formAction={signup} 
                className="w-full h-12 bg-[#4285F4] text-white border-2 border-[#1E1E24] rounded-xl font-bold shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px] transition-all"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
