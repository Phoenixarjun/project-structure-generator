import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthView() {
  const { data, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div className="auth-view">Feature: {data}</div>;
}
