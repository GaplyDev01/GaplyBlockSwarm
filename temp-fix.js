const fs = require('fs');
const path = require('path');

const filePath = '/Users/Wes/BSTXBT/src/application/ai/AIChatService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add safety check after every provider initialization
content = content.replace(
  /const aiProvider = provider[^;]*?getDefaultProvider\(\);/g,
  `const aiProvider = provider 
        ? this.registry.getProvider(provider)
        : this.registry.getDefaultProvider();
        
      // Safety check - make sure we have a valid provider
      if (\!aiProvider) {
        throw new Error(\`No AI provider available\${provider ? \` for \${provider}\` : ''}\`);
      }`
);

// Fix all supportsTools calls
content = content.replace(
  /aiProvider\.supportsTools\(\)/g,
  '(typeof aiProvider.supportsTools === "function" && aiProvider.supportsTools())'
);

// Fix null dereference in createChatCompletion calls
content = content.replace(
  /aiProvider\.createChatCompletion\(/g,
  'aiProvider?.createChatCompletion?.(');

// Fix handleToolCalls
content = content.replace(
  /await this\.handleToolCalls\(completion\.toolCalls\)/g,
  'await this.handleToolCalls(completion?.toolCalls || [])');

// Fix all optional chaining for chat messages
content = content.replace(
  /chat\.messages\[chat\.messages\.length - 1\]\.content/g,
  'chat.messages[chat.messages.length - 1]?.content');

// Fix optional chaining for role checks
content = content.replace(
  /messages\[messages\.length - 1\]\.role/g,
  'messages[messages.length - 1]?.role');

// Write the modified content back to the file
fs.writeFileSync(filePath, content);
console.log('Fixed null/undefined checks in AIChatService.ts');
