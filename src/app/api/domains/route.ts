import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST(req: Request) {
  try {
    const { domain, siteId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID } = await req.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    try {
      // Intentar autenticación con credenciales del entorno (GOOGLE_APPLICATION_CREDENTIALS)
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform']
      });
      const client = await auth.getClient();
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      const url = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/domains`;
      
      const response = await client.request({
        url,
        method: 'POST',
        data: {
          site: `projects/${projectId}/sites/${siteId}`,
          domainName: domain
        }
      });

      return NextResponse.json({ success: true, data: response.data });
    } catch (authError) {
      console.error("Firebase Hosting API Error:", authError);
      return NextResponse.json({ 
        success: false, 
        message: 'No se logró conectar a la API de Firebase Hosting (probablemente falta configuración de Service Account en .env).', 
        error: String(authError) 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
