import { Module, type ModuleMetadata, type Provider } from '@nestjs/common';

import { createGrpcClientProvider } from './client/client.factory';
import { GrpcClientAsyncConfig } from './types';

// ----------------------------------------------------------------------------

type GrpcClientAsyncOptions = Pick<ModuleMetadata, 'imports'> & GrpcClientAsyncConfig;

@Module({})
export class GrpcClientModule {
  static registerAsync(options: GrpcClientAsyncOptions[]) {
    const providers: Provider[] = options.map(({ imports, ...option }) => createGrpcClientProvider(option));

    return {
      module: GrpcClientModule,
      imports: options.flatMap((o) => o.imports || []),
      providers,
      exports: providers,
    };
  }
}
