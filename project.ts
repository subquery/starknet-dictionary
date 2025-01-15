import {
  StarknetProject,
  StarknetDatasourceKind,
  StarknetHandlerKind,
} from "@subql/types-starknet";

import * as dotenv from 'dotenv';
import path from 'path';

const mode = process.env.NODE_ENV || 'production';

// Load the appropriate .env file
const dotenvPath = path.resolve(__dirname, `.env${mode !== 'production' ? `.${mode}` : ''}`);
dotenv.config({ path: dotenvPath });

// Can expand the Datasource processor types via the generic param
const project: StarknetProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "starknet-starter",
  description:
      "A SubQuery project provide dictionary data & service for the STARKNET network",
  runner: {
    node: {
      name: "@subql/node-starknet",
      version: "*",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /**
     * chainId is the Chain ID, for Starknet mainnet this is 0x534e5f4d41494e
     * https://docs.metamask.io/services/reference/starknet/json-rpc-methods/starknet_chainid/
     */
    chainId: process.env.CHAIN_ID!,
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: process.env.ENDPOINT!?.split(',') as string[] | string,
  },
  dataSources: [
    {
      kind: StarknetDatasourceKind.Runtime,
      startBlock: 1,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: StarknetHandlerKind.Block,
            handler: "handleBlock",
          },
        ],
      },
    },
  ],
  repository: "https://github.com/subquery/starknet-dictionary",
};

// Must set default to the project instance
export default project;
