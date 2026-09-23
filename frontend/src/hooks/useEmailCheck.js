import { useState, useEffect, useRef } from 'react';
import { checkEmailAvailability } from '../services/authService';

const EMAIL_REGEX = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;

export const useEmailCheck = (email) => {
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'CHECKING' | 'AVAILABLE' | 'EXISTS' | 'INVALID'
  const [message, setMessage] = useState('');
  const [exists, setExists] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    const trimmed = (email || '').trim();

    if (!trimmed) {
      setStatus('IDLE');
      setMessage('');
      setExists(false);
      setIsAvailable(false);
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus('INVALID');
      setMessage('Please enter a valid email format');
      setExists(false);
      setIsAvailable(false);
      return;
    }

    // Set checking state
    setStatus('CHECKING');
    setMessage('Verifying email availability in real time...');

    const timer = setTimeout(async () => {
      try {
        const result = await checkEmailAvailability(trimmed);
        if (cancelRef.current) return;

        if (result.exists) {
          setStatus('EXISTS');
          setMessage('This email is already registered. Please sign in or use another email.');
          setExists(true);
          setIsAvailable(false);
        } else if (!result.domainValid) {
          setStatus('INVALID');
          setMessage(result.message || 'Email domain does not exist or has no active mail server.');
          setExists(false);
          setIsAvailable(false);
        } else if (result.available) {
          setStatus('AVAILABLE');
          setMessage('Email is valid and available');
          setExists(false);
          setIsAvailable(true);
        } else {
          setStatus('INVALID');
          setMessage(result.message || 'Email is not available');
          setExists(false);
          setIsAvailable(false);
        }
      } catch (err) {
        if (cancelRef.current) return;
        // If network error occurred, do not completely block, but warn
        setStatus('IDLE');
        setMessage('');
        setIsAvailable(true);
      }
    }, 450);

    return () => {
      cancelRef.current = true;
      clearTimeout(timer);
    };
  }, [email]);

  return {
    status,
    message,
    isChecking: status === 'CHECKING',
    exists,
    isAvailable,
    isInvalid: status === 'INVALID' || status === 'EXISTS',
  };
};

export default useEmailCheck;
