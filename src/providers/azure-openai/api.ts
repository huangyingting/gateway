import { ProviderAPIConfig } from '../types';
import {
  getAccessTokenFromEntraId,
  getAzureManagedIdentityToken,
} from './utils';

const AzureOpenAIAPIConfig: ProviderAPIConfig = {
  getBaseURL: ({ providerOptions }) => {
    const { resourceName, deploymentId } = providerOptions;
    return `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentId}`;
  },
  headers: async ({ providerOptions, fn }) => {
    const { apiKey, azureAuthMode } = providerOptions;

    if (azureAuthMode === 'entra') {
      const { azureEntraTenantId, azureEntraClientId, azureEntraClientSecret } =
        providerOptions;
      if (azureEntraTenantId && azureEntraClientId && azureEntraClientSecret) {
        const scope = 'https://cognitiveservices.azure.com/.default';
        const accessToken = await getAccessTokenFromEntraId(
          azureEntraTenantId,
          azureEntraClientId,
          azureEntraClientSecret,
          scope
        );
        return {
          Authorization: `Bearer ${accessToken}`,
        };
      }
    }
    if (azureAuthMode === 'managed') {
      const { azureManagedClientId } = providerOptions;
      const resource = 'https://cognitiveservices.azure.com/';
      const accessToken = await getAzureManagedIdentityToken(
        resource,
        azureManagedClientId
      );
      return {
        Authorization: `Bearer ${accessToken}`,
      };
    }
    const headersObj: Record<string, string> = {
      'api-key': `${apiKey}`,
    };
    if (fn === 'createTranscription' || fn === 'createTranslation')
      headersObj['Content-Type'] = 'multipart/form-data';
    return headersObj;
  },
  getEndpoint: ({ providerOptions, fn }) => {
    const { apiVersion, urlToFetch } = providerOptions;
    let mappedFn = fn;

    if (fn === 'proxy' && urlToFetch) {
      if (urlToFetch?.indexOf('/chat/completions') > -1) {
        mappedFn = 'chatComplete';
      } else if (urlToFetch?.indexOf('/completions') > -1) {
        mappedFn = 'complete';
      } else if (urlToFetch?.indexOf('/embeddings') > -1) {
        mappedFn = 'embed';
      } else if (urlToFetch?.indexOf('/images/generations') > -1) {
        mappedFn = 'imageGenerate';
      } else if (urlToFetch?.indexOf('/audio/speech') > -1) {
        mappedFn = 'createSpeech';
      } else if (urlToFetch?.indexOf('/audio/transcriptions') > -1) {
        mappedFn = 'createTranscription';
      } else if (urlToFetch?.indexOf('/audio/translations') > -1) {
        mappedFn = 'createTranslation';
      }
    }

    switch (mappedFn) {
      case 'complete': {
        return `/completions?api-version=${apiVersion}`;
      }
      case 'chatComplete': {
        return `/chat/completions?api-version=${apiVersion}`;
      }
      case 'embed': {
        return `/embeddings?api-version=${apiVersion}`;
      }
      case 'imageGenerate': {
        return `/images/generations?api-version=${apiVersion}`;
      }
      case 'createSpeech': {
        return `/audio/speech?api-version=${apiVersion}`;
      }
      case 'createTranscription': {
        return `/audio/transcriptions?api-version=${apiVersion}`;
      }
      case 'createTranslation': {
        return `/audio/translations?api-version=${apiVersion}`;
      }
      default:
        return '';
    }
  },
};

export default AzureOpenAIAPIConfig;
