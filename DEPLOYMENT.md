# Netlify Deployment Guide

This guide will help you set up automatic deployments from GitHub to Netlify for your AgentFlow application.

## Prerequisites

- GitHub repository: ✅ Already set up (`https://github.com/rory-hayes121/tuesday.git`)
- Netlify account (free tier works fine)
- Supabase project with environment variables

## Step 1: Connect GitHub to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your repository: `rory-hayes121/tuesday`

## Step 2: Configure Build Settings

Netlify should automatically detect the settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18 (set in netlify.toml)

## Step 3: Set Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values from Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" and "Project API Key (anon public)"

## Step 4: Deploy

1. Click "Deploy site" in Netlify
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be available at a random netlify.app URL

## Step 5: Set Up Custom Domain (Optional)

1. In Netlify → Site settings → Domain management
2. Add your custom domain
3. Configure DNS records as instructed

## Automatic Deployments

Once set up, every push to your main branch will:

1. ✅ Trigger an automatic build on Netlify
2. ✅ Run `npm run build` to create production assets
3. ✅ Deploy the `dist` folder to your live site
4. ✅ Apply security headers and SPA routing
5. ✅ Send you a notification (email/Slack if configured)

## Build Optimizations Included

The `netlify.toml` configuration includes:

- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Security Headers**: XSS protection, frame options, content type protection
- **Asset Caching**: Static assets cached for 1 year
- **Node.js 18**: Ensures consistent build environment

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify Supabase connection in build logs
- Ensure all dependencies are in `package.json`

### App Loads but Shows Errors
- Check browser console for errors
- Verify Supabase environment variables
- Check if database migrations have been applied

### Routing Issues (404 on refresh)
- The `netlify.toml` redirect should handle this
- If issues persist, check the redirect rule is working

## Testing the Setup

1. Make a small change to your code
2. Commit and push to GitHub: `git push origin main`
3. Check Netlify dashboard for deployment status
4. Visit your site URL to see the changes

## Support

If you run into issues:
1. Check Netlify build logs for specific errors
2. Verify environment variables match your Supabase project
3. Test the build locally with `npm run build`

Your AgentFlow app is now ready for automatic deployments! 🚀 