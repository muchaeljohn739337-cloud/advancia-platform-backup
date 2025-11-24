export default function Head() {
  const googleVerify = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return (
    <>{googleVerify ? <meta name="google-site-verification" content={googleVerify} /> : null}</>
  );
}
