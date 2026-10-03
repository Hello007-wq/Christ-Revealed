# TestFlight Distribution Guide

This guide covers the cleanest way to send the iOS app to someone who is far away.

TestFlight is the recommended method because the other person does not need their phone to be physically with you.

## What you need

- Apple Developer account
- Expo account with access to this project
- EAS CLI working
- The project environment variables already configured in EAS
- An iPhone user who can install the **TestFlight** app from the App Store

## Step 1. Go to the project folder

```powershell
cd "C:\Projects\MOBILE APPS\Christ_Revealed2\project"
```

## Step 2. Confirm Expo login

```powershell
cmd /c npx eas whoami
```

If needed:

```powershell
cmd /c npx eas login
```

## Step 3. Confirm EAS environment variables

Preview:

```powershell
cmd /c npx eas env:list --environment preview
```

Production:

```powershell
cmd /c npx eas env:list --environment production
```

Make sure the important values exist:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL` if still used

## Step 4. Run a quick health check

```powershell
cmd /c npx expo doctor
```

If there are blocking errors, fix them before building.

## Step 5. Start the iOS build

For TestFlight, use a production-style iOS build:

```powershell
cmd /c npx eas build --platform ios --profile production
```

If this is your first iOS build, EAS may ask you to:

- log into Apple Developer
- create signing certificates
- create provisioning profiles

Let EAS manage credentials automatically unless you have a reason not to.

## Step 6. Wait for the build to finish

When it completes, EAS gives you a build page link.

You can also inspect builds with:

```powershell
cmd /c npx eas build:list --platform ios
```

## Step 7. Submit the build to App Store Connect

After the iOS build succeeds:

```powershell
cmd /c npx eas submit --platform ios
```

EAS may ask:

- which Apple app to use
- whether to create the app record if needed

Complete that flow.

## Step 8. Open App Store Connect

Go to:

- https://appstoreconnect.apple.com/

Then:

1. Open **My Apps**
2. Select your app
3. Open **TestFlight**

At first the uploaded build may show as:

- Processing

Wait until Apple finishes processing it.

## Step 9. Add testers

There are two common ways:

### Internal testers

Use this if the person is part of your App Store Connect team.

### External testers

Use this if the person is not on your team.

For external testers:

1. Go to **TestFlight**
2. Create a tester group
3. Add the person’s email
4. Assign the build to that group

Apple may require a short beta review before the first external build becomes available.

## Step 10. Send the person the invite

The tester should:

1. Install **TestFlight** from the App Store
2. Open the invite email or public link
3. Accept the invitation
4. Install the app from TestFlight

## What the other person needs

- iPhone
- Apple ID
- TestFlight app installed
- your invite email or public link

## If you want a public TestFlight link

Inside App Store Connect:

1. Open the tester group
2. Enable **Public Link** if available
3. Share that link

That is the closest iOS equivalent to “send a link and install.”

## Common issues

### No Apple Developer account

You cannot distribute to outside iPhones through TestFlight without Apple Developer membership.

### Build succeeded but not visible in TestFlight

Usually Apple is still processing the build. Wait and refresh App Store Connect.

### External testers cannot install yet

The build may still need Apple beta review approval for external testing.

### Environment works on Android but fails on iOS

Check EAS environment variables again:

```powershell
cmd /c npx eas env:list --environment production
```

## Recommended sequence

1. `expo doctor`
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios`
4. Wait for App Store Connect processing
5. Add tester email or enable public link
6. Send TestFlight invite
