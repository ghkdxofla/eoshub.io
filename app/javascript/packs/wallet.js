import _ from 'lodash';

import walletStatus from './constant';
import { scatterConfig } from './config';
import { getScatter, updateScatter } from './state';

// TODO(heejae): Make this file as an interface. It just deal with Scatter wallet for now.
function checkWalletStatus() {
  const { scatterClient, account, permission } = getScatter();
  if (scatterClient) {
    if (account && permission) {
      return walletStatus.authenticated;
    }

    return walletStatus.loaded;
  }

  return walletStatus.notFound;
}

// NOTE(heejae): Please wrap async functions with try-catch when in usage.
// Async functions throw an exception when something goes wrong.
async function authenticateAccount() {
  const scatter = getScatter();
  const { chainId, blockchain } = scatterConfig;

  if (scatter.scatterClient.identity) {
    await scatter.scatterClient.forgetIdentity();
  }

  const { accounts } = await scatter.scatterClient.getIdentity({
    accounts: [{ chainId, blockchain }],
  });
  const eosAccounts = _.filter(
    accounts,
    account => account.blockchain === 'eos',
  );
  if (_.isEmpty(eosAccounts)) {
    throw new Error('User must have at least one eos account.');
  }

  const { authority, name } = _.head(accounts);
  updateScatter({
    ...scatter,
    account: name,
    authority,
  });
}

async function invalidateAccount() {
  const scatter = getScatter();
  if (scatter.scatterClient.identity) {
    await scatter.scatterClient.forgetIdentity();
  }

  updateScatter({
    ...scatter,
    account: '',
    autority: '',
  });
}

export { checkWalletStatus, authenticateAccount, invalidateAccount };
