'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select';

export interface AIProviderOption {
  id: string;
  name: string;
  description?: string;
  models: Array<{
    id: string;
    name: string;
    description?: string;
    contextWindow?: number;
  }>;
}

interface ProviderSelectorProps {
  providers: AIProviderOption[];
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false,
}) => {
  const currentProvider = providers.find(provider => provider.id === selectedProvider);
  const models = currentProvider?.models || [];

  return (
    <div className="flex flex-col sm:flex-row gap-2 max-w-screen-lg mx-auto p-4">
      <div className="flex-1">
        <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          AI Provider
        </label>
        <Select
          disabled={disabled}
          value={selectedProvider}
          onValueChange={onProviderChange}
        >
          <SelectTrigger id="provider-select" className="w-full" aria-label="Select AI provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Model
        </label>
        <Select
          disabled={disabled || models.length === 0}
          value={selectedModel}
          onValueChange={onModelChange}
        >
          <SelectTrigger id="model-select" className="w-full" aria-label="Select AI model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
                {model.contextWindow && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    ({Math.floor(model.contextWindow / 1000)}k)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};