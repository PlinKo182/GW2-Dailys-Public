# GW2 API Key Feature - Implementação Completa

## 📋 Resumo

Esta funcionalidade permite que cada usuário adicione sua própria API key do Guild Wars 2 para acessar dados personalizados da conta, começando com **Map Chests**.

## 🎯 Funcionalidades Implementadas

### 1. **Backend (Python/FastAPI)**

#### Novos Endpoints
- `POST /api/user/gw2-api-key` - Salvar/atualizar GW2 API key do usuário
  - Valida formato da key
  - Verifica com a API do GW2 (`/v2/account` e `/v2/tokeninfo`)
  - Confirma permissão "account"
  - Armazena key, permissões e nome da conta

- `DELETE /api/user/gw2-api-key/{userName}` - Remover API key do usuário

- `GET /api/user/mapchests/{userName}` - Buscar map chests do usuário
  - Usa a API key armazenada
  - Retorna dados de `https://api.guildwars2.com/v2/account/mapchests`
  - Indica se a key precisa ser configurada/renovada

#### Modificações no Schema MongoDB
Campos adicionados à coleção `users`:
```javascript
{
  gw2ApiKey: String,              // API key criptografada
  gw2ApiKeyPermissions: Array,    // Permissões da key
  gw2AccountName: String,         // Nome da conta GW2
  gw2ApiKeyUpdatedAt: DateTime    // Data da última atualização
}
```

#### Dependências
- Adicionado `httpx>=0.27.0` ao `requirements.txt`

### 2. **Frontend (React)**

#### Novos Componentes

**`MapChestsTab.jsx`**
- Nova aba entre "Live Events" e "History"
- Formulário para adicionar API key (quando não configurada)
- Exibição dos map chests disponíveis
- Botão de refresh para recarregar dados
- Instruções para obter API key do GW2

**`SettingsDialog.jsx`**
- Modal de configurações acessível pelo header
- Gerenciamento completo da API key:
  - Visualizar status (ativa/inativa)
  - Ver nome da conta GW2 vinculada
  - Ver permissões da key
  - Atualizar API key
  - Remover API key
- Instruções para criar nova key

#### Modificações em Componentes Existentes

**`Dashboard.jsx`**
- Adicionada aba "Map Chests" entre "Live Events" e "History"
- Integração do componente `MapChestsTab`

**`Header.jsx`**
- Adicionado botão de Settings (ícone de engrenagem)
- Integração do `SettingsDialog`

**`useStore.js` (Zustand Store)**
Novos estados:
```javascript
hasGW2ApiKey: boolean
gw2AccountName: string | null
gw2ApiKeyPermissions: Array
```

Novas ações:
```javascript
saveUserGW2ApiKey(apiKey)
removeUserGW2ApiKey()
```

**`api.js` (Services)**
Novas funções:
```javascript
saveGW2ApiKey(userName, apiKey)
deleteGW2ApiKey(userName)
fetchMapChests(userName)
```

## 🔐 Segurança

- ✅ API key armazenada apenas no backend (MongoDB)
- ✅ Nunca exposta no localStorage do browser
- ✅ Validação de formato antes de aceitar
- ✅ Verificação com API oficial do GW2
- ✅ Confirmação de permissões necessárias
- ✅ Tratamento de keys inválidas/expiradas

## 🚀 Como Usar

### Para Usuários

1. **Fazer Login** no Tyria Tracker

2. **Obter API Key do GW2**:
   - Visitar https://account.arena.net/applications
   - Clicar em "New Key"
   - Dar um nome (ex: "Tyria Tracker")
   - Marcar permissão "account"
   - Copiar a key gerada

3. **Adicionar API Key**:
   - **Opção 1**: Ir para aba "Map Chests" e colar a key
   - **Opção 2**: Clicar no ícone de Settings (⚙️) no header e adicionar

4. **Ver Map Chests**:
   - Acessar aba "Map Chests"
   - Dados carregam automaticamente
   - Usar botão "Refresh" para atualizar

5. **Gerenciar API Key**:
   - Clicar em Settings (⚙️)
   - Ver status, conta vinculada e permissões
   - Atualizar ou remover conforme necessário

### Para Desenvolvedores

#### Adicionar Novos Endpoints de Account

O sistema está preparado para adicionar mais endpoints da GW2 API que requerem autenticação:

```javascript
// Backend (server.py)
@api_router.get("/user/wallet/{userName}")
async def get_user_wallet(userName: str):
    user_doc = users_collection.find_one({"userName": userName})
    api_key = user_doc.get("gw2ApiKey")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            "https://api.guildwars2.com/v2/account/wallet",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        return {"success": True, "data": response.json()}

// Frontend (api.js)
export async function fetchWallet(userName) {
  const response = await axiosInstance.get(`${API}/user/wallet/${userName}`);
  return response.data;
}
```

#### Estrutura de Arquivos

```
backend/
├── server.py                    # Novos endpoints adicionados
└── requirements.txt             # httpx adicionado

frontend/src/
├── components/
│   ├── MapChestsTab.jsx        # NOVO - Aba de Map Chests
│   ├── SettingsDialog.jsx      # NOVO - Dialog de Settings
│   ├── Dashboard.jsx           # Modificado - Nova aba
│   └── Header.jsx              # Modificado - Botão Settings
├── services/
│   └── api.js                  # Modificado - Novas funções
└── store/
    └── useStore.js             # Modificado - Novos estados/ações
```

## 🧪 Testes Recomendados

- [ ] Criar usuário novo e adicionar API key
- [ ] Verificar validação de formato inválido
- [ ] Testar API key sem permissão "account"
- [ ] Ver map chests funcionando
- [ ] Atualizar API key existente
- [ ] Remover API key
- [ ] Verificar comportamento quando key expira
- [ ] Testar com múltiplos usuários diferentes
- [ ] Confirmar que keys não aparecem no browser

## 📝 Próximos Passos Sugeridos

### Dados Adicionais da Account API
- `/v2/account/achievements` - Conquistas
- `/v2/account/bank` - Banco
- `/v2/account/inventory` - Inventário
- `/v2/account/materials` - Material Storage
- `/v2/account/wallet` - Moedas e tokens
- `/v2/characters` - Personagens

### Melhorias
- Cache de dados da API (evitar requests repetidas)
- Sincronização automática periódica
- Notificações quando map chests resetam
- Dashboard personalizado com estatísticas da conta
- Exportação de dados

## 🐛 Troubleshooting

### "Invalid API key format"
- Verificar se copiou a key completa
- Key deve ter formato: `XXXX-XXXX-...` (8 blocos separados por hífen)

### "API key must have 'account' permission"
- Ao criar a key, marcar checkbox "account"
- Criar nova key com permissões corretas

### "API key is invalid or expired"
- Verificar se key ainda existe em https://account.arena.net/applications
- Criar nova key se necessário
- Atualizar no Settings

### Map chests não aparecem
- Confirmar que API key está ativa (Settings)
- Clicar em "Refresh"
- Verificar console do browser para erros
