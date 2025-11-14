
'use client';
// This file is kept for historical purposes but is no longer central
// to the error handling strategy since migrating to Supabase.
// The custom error class could be adapted for Supabase RLS errors if needed.

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface SecurityRuleRequest {
  auth: { uid: string | null } | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = {
      auth: { uid: 'COULD_NOT_DETERMINE' }, // Placeholder
      method: context.operation,
      path: `/databases/(default)/documents/${context.path}`,
      resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
    } as SecurityRuleRequest;

    const message = `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
    
    super(message);
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
