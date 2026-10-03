# iOS Build Guide

This project uses Expo + EAS Build for iOS.

## 1. Requirements

- Apple Developer account
- EAS CLI access
- Correct Expo environment variables already saved in EAS

## 2. Confirm EAS login

```powershell
cmd /c npx eas whoami
```

If you are not logged in:

```powershell
cmd /c npx eas login
```

## 3. Confirm environment variables

Check the environment used for your build:

```powershell
cmd /c npx eas env:list --environment preview
cmd /c npx eas env:list --environment production
```

Make sure the values you need exist:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL` if still used

## 4. Validate app config

From the project root:

```powershell
cd "C:\Projects\MOBILE APPS\Christ_Revealed2\project"
cmd /c npx expo doctor
```

## 5. Start an iOS preview build

For internal testing:

```powershell
cmd /c npx eas build --platform ios --profile preview
```

## 6. Start an iOS production build

For App Store or TestFlight preparation:

```powershell
cmd /c npx eas build --platform ios --profile production
```

## 7. Apple signing

During the first iOS build, EAS may ask to:

- create or use an iOS distribution certificate
- create or use a provisioning profile
- connect to your Apple Developer account

The simplest route is to let EAS manage credentials automatically.

## 8. Install or distribute

After the build finishes:

- use the build link from EAS
- install on test devices if the build type allows it
- or submit to TestFlight

## 9. Submit to App Store Connect

If you are ready to submit:

```powershell
cmd /c npx eas submit --platform ios
```

## 10. Common issues

### Missing environment variables

If the iOS build opens but cannot connect to Supabase, re-check:

```powershell
cmd /c npx eas env:list --environment production
```

### Apple credentials issue

If signing fails, re-run the build and allow EAS to repair credentials.

### Native dependency mismatch

If Expo reports package version issues:

```powershell
cmd /c npx expo doctor
```

Then align package versions before building again.

## Recommended workflow

1. Run `expo doctor`
2. Build with `preview`
3. Test on device
4. Build with `production`
5. Submit with `eas submit`
