import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { authApi } from "@/features/auth/api/authApi";
import { SocialButton, GoogleIcon } from "@/components/ui/SocialButtons";
import GoogleRoleModal from "./GoogleRoleModal";

export default function GoogleAuthButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const finish = async (res) => {
    const user = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${res.access_token}` },
    }).then((r) => r.json());
    onSuccess(user, res.access_token, res.refresh_token);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await authApi.googleAuth(tokenResponse.access_token);
        if (res.requires_role_selection) {
          setToken(tokenResponse.access_token);
          setUserInfo({ email: res.email, full_name: res.full_name, profile_photo_url: res.profile_photo_url });
          setLoading(false);
          return;
        }
        await finish(res);
      } catch (err) {
        onError(err.response?.data?.detail || "Google sign-in failed.");
        setLoading(false);
      }
    },
    onError: () => onError("Google sign-in was cancelled or failed."),
  });

  const handleRoleConfirm = async (role) => {
    setLoading(true);
    try {
      const res = await authApi.googleAuth(token, role);
      setUserInfo(null);
      setToken(null);
      await finish(res);
    } catch (err) {
      onError(err.response?.data?.detail || "Google sign-up failed.");
      setLoading(false);
    }
  };

  return (
    <>
      {userInfo && (
        <GoogleRoleModal
          userInfo={userInfo}
          onConfirm={handleRoleConfirm}
          onClose={() => { setUserInfo(null); setToken(null); }}
          loading={loading}
        />
      )}
      <SocialButton
        icon={<GoogleIcon />}
        label="Google"
        onClick={() => googleLogin()}
        loading={loading}
      />
    </>
  );
}
