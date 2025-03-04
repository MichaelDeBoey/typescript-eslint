import { useHistory } from '@docusaurus/router';
import * as lz from 'lz-string';
import { useCallback, useState } from 'react';

import type { ConfigFileType, ConfigModel, ConfigShowAst } from '../types';

import { hasOwnProperty } from '../lib/has-own-property';
import { toJsonConfig } from '../lib/json';
import { shallowEqual } from '../lib/shallowEqual';
import { fileTypes } from '../options';

function writeQueryParam(value: string | null): string {
  return (value && lz.compressToEncodedURIComponent(value)) ?? '';
}

function readQueryParam(value: string | null, fallback: string): string {
  return (value && lz.decompressFromEncodedURIComponent(value)) ?? fallback;
}

function readShowAST(value: string | null): ConfigShowAst {
  switch (value) {
    case 'es':
    case 'scope':
    case 'ts':
    case 'types':
      return value;
  }
  return value ? 'es' : false;
}

function readFileType(value: string | null): ConfigFileType {
  if (value && (fileTypes as string[]).includes(value)) {
    return value as ConfigFileType;
  }
  return '.ts';
}

function readLegacyParam(
  data: string | null,
  prop: string,
): string | undefined {
  try {
    return toJsonConfig(JSON.parse(readQueryParam(data, '{}')), prop);
  } catch (e) {
    console.error(e, data, prop);
  }
  return undefined;
}

const parseStateFromUrl = (
  hash: string,
  initialState: ConfigModel,
): Partial<ConfigModel> | undefined => {
  if (!hash) {
    return;
  }

  try {
    const searchParams = new URLSearchParams(hash);

    let eslintrc: string | undefined;
    if (searchParams.has('eslintrc')) {
      eslintrc = readQueryParam(searchParams.get('eslintrc'), '');
    } else if (searchParams.has('rules')) {
      eslintrc = readLegacyParam(searchParams.get('rules'), 'rules');
    }

    let tsconfig: string | undefined;
    if (searchParams.has('tsconfig')) {
      tsconfig = readQueryParam(searchParams.get('tsconfig'), '');
    } else if (searchParams.has('tsConfig')) {
      tsconfig = readLegacyParam(
        searchParams.get('tsConfig'),
        'compilerOptions',
      );
    }

    let esQuery: ConfigModel['esQuery'] | undefined;
    if (searchParams.has('esQuery')) {
      esQuery = JSON.parse(
        readQueryParam(searchParams.get('esQuery'), ''),
      ) as ConfigModel['esQuery'];
    }

    const fileType =
      searchParams.get('jsx') === 'true'
        ? '.tsx'
        : readFileType(searchParams.get('fileType'));

    const code = searchParams.has('code')
      ? readQueryParam(searchParams.get('code'), '')
      : '';

    return {
      code,
      eslintrc: eslintrc ?? initialState.eslintrc,
      esQuery,
      fileType,
      showAST: readShowAST(searchParams.get('showAST')),
      showTokens: searchParams.get('tokens') === 'true',
      sourceType:
        searchParams.get('sourceType') === 'script' ? 'script' : 'module',
      ts: searchParams.get('ts') ?? process.env.TS_VERSION,
      tsconfig: tsconfig ?? initialState.tsconfig,
    };
  } catch (e) {
    console.warn(e);
  }
  return undefined;
};

const writeStateToUrl = (newState: ConfigModel): string | undefined => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('ts', newState.ts.trim());
    if (newState.sourceType === 'script') {
      searchParams.set('sourceType', newState.sourceType);
    }
    if (newState.showAST) {
      searchParams.set('showAST', newState.showAST);
    }
    if (newState.fileType) {
      searchParams.set('fileType', newState.fileType);
    }
    if (newState.esQuery) {
      searchParams.set(
        'esQuery',
        writeQueryParam(JSON.stringify(newState.esQuery)),
      );
    }
    searchParams.set('code', writeQueryParam(newState.code));
    searchParams.set('eslintrc', writeQueryParam(newState.eslintrc));
    searchParams.set('tsconfig', writeQueryParam(newState.tsconfig));
    searchParams.set('tokens', String(!!newState.showTokens));
    return searchParams.toString();
  } catch (e) {
    console.warn(e);
  }
  return undefined;
};

const retrieveStateFromLocalStorage = (): Partial<ConfigModel> | undefined => {
  try {
    const configString = window.localStorage.getItem('config');
    if (!configString) {
      return undefined;
    }

    const config: unknown = JSON.parse(configString);
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const state: Partial<ConfigModel> = {};
    if (hasOwnProperty('ts', config)) {
      const ts = config.ts;
      if (typeof ts === 'string') {
        state.ts = ts;
      }
    }
    if (hasOwnProperty('fileType', config)) {
      const fileType = config.fileType;
      if (fileType === 'true') {
        state.fileType = readFileType(fileType);
      }
    }
    if (hasOwnProperty('showAST', config)) {
      const showAST = config.showAST;
      if (typeof showAST === 'string') {
        state.showAST = readShowAST(showAST);
      }
    }
    state.scroll = hasOwnProperty('scroll', config) && !!config.scroll;

    return state;
  } catch (e) {
    console.warn(e);
  }
  return undefined;
};

const writeStateToLocalStorage = (newState: ConfigModel): void => {
  const config: Partial<ConfigModel> = {
    fileType: newState.fileType,
    scroll: newState.scroll,
    showAST: newState.showAST,
    sourceType: newState.sourceType,
    ts: newState.ts,
  };
  window.localStorage.setItem('config', JSON.stringify(config));
};

export function useHashState(
  initialState: ConfigModel,
): [ConfigModel, (cfg: Partial<ConfigModel>) => void] {
  const history = useHistory();
  const [state, setState] = useState<ConfigModel>(() => ({
    ...initialState,
    ...retrieveStateFromLocalStorage(),
    ...parseStateFromUrl(window.location.hash.slice(1), initialState),
  }));

  const updateState = useCallback(
    (cfg: Partial<ConfigModel>) => {
      console.info('[State] updating config diff', cfg);

      setState(oldState => {
        const newState = { ...oldState, ...cfg };

        if (shallowEqual(oldState, newState)) {
          return oldState;
        }

        writeStateToLocalStorage(newState);

        history.replace({
          ...history.location,
          hash: writeStateToUrl(newState),
        });

        if (cfg.ts) {
          window.location.reload();
        }
        return newState;
      });
    },
    [setState, history],
  );

  return [state, updateState];
}
