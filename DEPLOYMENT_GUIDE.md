# 🚀 Deployment Guide for Sarathi Book

Follow this step-by-step guide to publish your app to the world using **GitHub** (for code storage) and **Vercel** (for hosting).

---

## **Part 1: Prepare Your Code (GitHub)**

### 1. Initialize Git
Open your VS Code terminal (Ctrl + `) and run these commands one by one:

```bash
# 1. Initialize a new git repository
git init

# 2. Add all your files to the staging area
git add .

# 3. Commit your files (Save the current state)
git commit -m "Initial launch of Sarathi Book"
```

### 2. Create a Repository on GitHub
1.  Go to [github.com/new](https://github.com/new) (Log in if needed).
2.  **Repository name**: `sarathi-book`.
3.  **Visibility**: Choose **Public** (Free) or **Private** (Secure).
4.  Click **Create repository**.

### 3. Connect and Push
You will see a page with commands. Look for the section **"…or push an existing repository from the command line"**. Copy and paste those commands into your VS Code terminal. They will look like this:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sarathi-book.git
git branch -M main
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username)*

---

## **Part 2: Publish to the Web (Vercel)**

### 1. Import Project
1.  Go to [vercel.com/new](https://vercel.com/new) (Log in with GitHub).
2.  You should see your `sarathi-book` repository in the list.
3.  Click the **Import** button next to it.

### 2. Configure Project
1.  **Project Name**: Leave as `sarathi-book` or change if you want.
2.  **Framework Preset**: It should automatically detect **Vite**.
3.  **Root Directory**: Leave as `./`.

### 3. Add Environment Variables (IMPORTANT)
This is the most critical step. Your app needs the Supabase keys to work.
1.  Click to expand the **Environment Variables** section.
2.  Open your local `.env` file in VS Code.
3.  Copy and paste the keys exactly as they appear:

| Name | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | *[Paste the URL from your .env file]* |
| `VITE_SUPABASE_ANON_KEY` | *[Paste the Key from your .env file]* |

4.  Click **Add** after entering each one.

### 4. Deploy
1.  Click the big **Deploy** button.
2.  Wait about 1 minute.
3.  You will see a "Congratulations!" screen.

---

## **Done! 🎉**
Your app is now live! You will get a link like:
`https://sarathi-book.vercel.app`

Sharing this link allows any driver to access the app via their browser and install it as a PWA.
