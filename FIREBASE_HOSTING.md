# Guia de Implantação no Firebase Hosting 🚀

Este projeto foi refatorado e preparado com sucesso para ser hospedado no **Firebase Hosting**. 
Isso permite que os arquivos estáticos do frontend do seu aplicativo (HTML, JS, CSS, imagens) sejam servidos com altíssimo desempenho a partir da CDN global do Firebase, com suporte a cache inteligente e certificados SSL automáticos.

---

## 📂 Arquivos de Configuração Criados

1. **`.firebaserc`**: Vincula automaticamente o projeto local ao seu ID do projeto Firebase (`estudo-teologico001`).
2. **`firebase.json`**: Define as regras do Firebase Hosting e do Firestore Security Rules:
   - Aponta a pasta pública para `dist/` (gerada pelo build do Vite).
   - Configura o roteamento de Single-Page Application (SPA), garantindo que rotas do cliente sejam redirecionadas para o `index.html`.
   - Inclui regras de segurança padrão do Firestore (`firestore.rules`).
   - Direciona as chamadas de API (`/api/**`) para uma função servidora ou serviço de backend.

---

## 🛠️ Como Realizar o Deploy

Você pode implantar seu aplicativo usando duas arquiteturas principais para a API do backend:

### Opção A: Frontend no Firebase Hosting + Backend no Cloud Run (Recomendado)
Esta é a opção mais simples e poderosa. O seu servidor Express roda em um contêiner no **Google Cloud Run**, e o Firebase Hosting faz o roteamento transparente da API para lá.

1. **Atualize o arquivo `firebase.json`** para apontar para o seu serviço do Cloud Run substituindo o objeto `rewrites` da API por:
   ```json
   "rewrites": [
     {
       "source": "/api/**",
       "run": {
         "serviceId": "NOME_DO_SEU_SERVICO_CLOUD_RUN",
         "region": "us-central1"
       }
     },
     {
       "source": "**",
       "destination": "/index.html"
     }
   ]
   ```
2. Instale a ferramenta Firebase CLI (se ainda não tiver):
   ```bash
   npm install -g firebase-tools
   ```
3. Faça login na sua conta Google:
   ```bash
   firebase login
   ```
4. Execute o comando de deploy integrado criado no `package.json`:
   ```bash
   npm run deploy:firebase
   ```

---

### Opção B: Frontend no Firebase Hosting + Backend em Firebase Cloud Functions
Se você preferir rodar todo o backend de forma 100% serverless dentro do próprio ecossistema do Firebase:

1. O arquivo `firebase.json` já está pré-configurado para reescrever as chamadas de `/api/**` para uma Cloud Function chamada `api`.
2. Para criar essa função, você pode inicializar a pasta de funções do Firebase:
   ```bash
   firebase init functions
   ```
3. Escolha **TypeScript** e, no arquivo `functions/src/index.ts` gerado, você pode importar e empacotar o seu servidor Express usando a biblioteca `firebase-functions`:
   ```typescript
   import * as functions from 'firebase-functions';
   import express from 'express';
   
   const app = express();
   // Adicione seus roteadores locais (/api/chat, /api/verse, etc.) aqui...
   
   export const api = functions.https.onRequest(app);
   ```
4. Execute `npm run deploy:firebase` para enviar o frontend e as funções simultaneamente para a nuvem do Firebase!

---

## ⚡ Scripts Disponíveis no `package.json`

* `npm run build:hosting`: Executa apenas o build dos arquivos estáticos do frontend (pasta `dist`).
* `npm run deploy:firebase`: Realiza o build do projeto completo e faz o upload direto para o Firebase Hosting e Firestore.
