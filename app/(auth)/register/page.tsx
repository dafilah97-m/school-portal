'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Occupation } from '@/lib/types'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [occupation, setOccupation] = useState<Occupation>('student')
  const [teacherSubject, setTeacherSubject] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setAvatar(file)
    setAvatarPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (!avatar) {
      toast.error('A profile photo is required')
      return
    }
    if (occupation === 'teacher' && !teacherSubject.trim()) {
      toast.error('Enter the subject you teach')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          phone,
          id_number: idNumber,
          occupation,
          teacher_subject: occupation === 'teacher' ? teacherSubject : null,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      toast.error('Something went wrong creating your account')
      setLoading(false)
      return
    }

    const avatarForm = new FormData()
    avatarForm.append('userId', data.user.id)
    avatarForm.append('email', email)
    avatarForm.append('file', avatar)

    const avatarRes = await fetch('/api/auth/claim-avatar', { method: 'POST', body: avatarForm })
    if (!avatarRes.ok) {
      const avatarData = await avatarRes.json()
      toast.error(avatarData.error || 'Account created, but the photo upload failed')
    }

    if (!data.session) {
      toast.success('Account created — check your email to confirm, then sign in.')
      router.push('/login')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Preview" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-xs text-muted-foreground">Photo</span>
                )}
              </div>
              <Label htmlFor="avatar" className="text-xs cursor-pointer underline">
                {avatar ? 'Change photo' : 'Upload a profile photo *'}
              </Label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="id_number">ID / passport number</Label>
                <Input id="id_number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occupation">I am a</Label>
              <select
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value as Occupation)}
                className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {occupation === 'teacher' && (
              <div className="space-y-1.5">
                <Label htmlFor="teacher_subject">Subject you teach</Label>
                <Input
                  id="teacher_subject"
                  placeholder="e.g. Mathematics"
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A Super Admin will review this before you get Subject Admin access.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              Create account
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-gray-900 underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
