#!/bin/bash

# Script para validar se as variáveis de ambiente necessárias estão presentes e não vazias.

echo "============================================="
echo "   Validando Variáveis de Ambiente Críticas  "
echo "============================================="

FAILED=0

if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ ERRO: A variável de ambiente GEMINI_API_KEY não foi encontrada ou está vazia."
  FAILED=1
else
  # Mostra apenas as extremidades da chave por motivos de segurança
  if [ ${#GEMINI_API_KEY} -ge 10 ]; then
    MASKED="${GEMINI_API_KEY:0:6}...${GEMINI_API_KEY: -4}"
  else
    MASKED="***"
  fi
  echo "✅ GEMINI_API_KEY está configurada corretamente: $MASKED"
fi

if [ "$FAILED" -eq 1 ]; then
  echo "============================================="
  echo "❌ Falha na validação das variáveis! Abortando build."
  echo "============================================="
  exit 1
else
  echo "============================================="
  echo "✅ Todas as variáveis críticas foram validadas com sucesso!"
  echo "============================================="
  exit 0
fi
