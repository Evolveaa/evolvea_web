-- Advisor fixes for the speech-capture functions: pin search_path on the
-- trigger guard and hide internal functions from the exposed RPC surface
-- (they are only ever called by triggers / pg_cron / the service role).

alter function public.protect_speech_attempt_update() set search_path = public;

revoke execute on function public.delete_speech_audio_object() from public, anon, authenticated;
revoke execute on function public.purge_expired_speech_audio() from public, anon, authenticated;
