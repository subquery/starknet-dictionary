import {StarknetBlock, StarknetLog, StarknetTransaction} from "@subql/types-starknet";
import {Call, Log} from "../types";
import {flatten} from "lodash";


export async function handleBlock(block: StarknetBlock): Promise<void> {
  const logs = block.logs.map((log, index) => handleLog(log,index));
  const calls = block.transactions.map(tx => handleTransaction(tx));
  logger.info(`Block #${block.blockNumber}, Saving ${logs.length} logs and ${calls.length} calls`);
  await Promise.all([
    store.bulkCreate('Log', logs),
    store.bulkCreate('Call', (flatten(calls)))
  ]);
}

export function handleLog(log: StarknetLog, index:number): Log {
  return Log.create({
    id: `${log.blockNumber}-${index}`,
    address: log.address.toLowerCase(),
    blockHeight: BigInt(log.blockNumber),
    topics: log.topics
  });
}
export function handleTransaction(transaction: StarknetTransaction): Call[] {
    const calls: Call[] = [];

    switch (transaction.type) {
        case "DECLARE":
        case "DEPLOY":
        case "DEPLOY_ACCOUNT":
        case "L1_HANDLER":
            calls.push(handleGenericCall(transaction));
            break;
        case "INVOKE":
            // we are expecting this not exist, as it parseCallData never been called.
            if(transaction.decodedCalls === undefined){
                transaction.decodedCalls = transaction.parseCallData();
            }
            calls.push(...handleInvokeHandler(transaction));
            break;

        default:
        // Do nothing
    }
    return calls;
}

function handleGenericCall(transaction: StarknetTransaction): Call {
    const call = new Call(
        `${transaction.blockNumber}-${transaction.transactionIndex}`,
        transaction.hash,
        transaction.from,
        BigInt(transaction.blockNumber)
    );
    if(transaction.from === undefined){
        throw new Error(`Transaction from is undefined, ${call.id},hash ${transaction.hash}`);
    }
    call.selector = transaction.entryPointSelector;
    call.type = transaction.type;
    return call;
}

//Handle INVOKE transaction
function handleInvokeHandler(transaction: StarknetTransaction): Call[] {
    const calls: Call[] = [];
    if (!transaction.decodedCalls) {
        return calls;
    }
    for (const call of transaction.decodedCalls) {
        const newCall = new Call(
            `${transaction.blockNumber}-${transaction.transactionIndex}`,
            transaction.hash,
            transaction.from,
            BigInt(transaction.blockNumber)
        );

        if(transaction.from === undefined){
            throw new Error(`Transaction from is undefined, ${newCall.id},hash ${transaction.hash}`);
        }
        newCall.selector = call.selector;
        newCall.to = call.to;
        newCall.type = transaction.type;
        calls.push(newCall);
    }
    return calls;
}