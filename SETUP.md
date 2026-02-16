# Setup Guide for ExamNexus

## 1. Prerequisites
- Node.js installed
- A Supabase account (https://supabase.com)

## 2. Supabase Setup

### Database Schema
1. Go to your Supabase Project Dashboard -> SQL Editor.
2. Copy the contents of `supabase/migrations/0000_setup_schema.sql`.
3. Paste and run the SQL query. This will create tables for Users (Profiles), Classes, Exams, and Submissions, along with security policies.

### Storage Bucket
1. Go to Supabase Project Dashboard -> Storage.
2. Create a new public bucket named `exams`.
3. Ensure the bucket is set to **Public** so PDFs can be downloaded/viewed via URL.
4. (Optional) Set up RLS policies for storage if you want strict access control, but public is fine for this demo.

### Environment Variables
1. Rename `.env.local.example` (or creates `.env.local`) to `.env.local` if not already done.
2. Get your **Project URL** and **anon public key** from Supabase Project Settings -> API.
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Running the App
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## 4. Seeding Initial Data
Since the app relies on authenticated users, follow these steps to seed data:

1. **Sign Up**: Go to `/signup` and create an **Instructor** account.
2. **Get User ID**: In Supabase Dashboard -> Authentication -> Users, copy the `User UID` of the user you just created.
3. **Run Seeds**:
   - Open `supabase/seeds.sql`.
   - Replace `YOUR_USER_ID_HERE` with the copied UID.
   - Run the SQL in Supabase SQL Editor.
   - This will create a sample class and exam for you.
