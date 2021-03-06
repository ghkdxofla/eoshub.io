// Must import babel-polyfill only one time to support ES7!
import 'babel-polyfill';
import '../stylesheets/style.scss';

import eos from 'eosjs';
import ecc from 'eosjs-ecc';

import Elm from '../elm/Main'; // eslint-disable-line import/no-unresolved
import {
  getWalletStatus,
  authenticateAccount,
  invalidateAccount,
  getAuthInfo,
} from './wallet';
import { scatterConfig, eosjsConfig } from './config';
import {
  getElm,
  getScatter,
  updateElm,
  updateScatter,
} from './state';

function createResponseStatus() {
  const { account, authority } = getScatter();
  return {
    status: getWalletStatus(),
    account,
    authority,
  };
}

function createPushActionReponse(code, action, type, msg) {
  return {
    code,
    action,
    type_: !type ? '' : type,
    message: !msg ? '' : msg,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('elm-target');

  if (!target) {
    return;
  }

  const app = Elm.Main.embed(target, {
    node_env: process.env.NODE_ENV,
  });

  app.ports.checkWalletStatus.subscribe(async () => {
    app.ports.receiveWalletStatus.send(createResponseStatus());
  });

  // TODO(heejae): After wallet auth success/error message popup is devised,
  // deal with cases.
  app.ports.authenticateAccount.subscribe(async () => {
    try {
      await authenticateAccount();
    } catch (err) {
      if (err.isError && err.isError === true) {
        // Deal with scatter error.
        console.error(err);
      }
    }
    app.ports.receiveWalletStatus.send(createResponseStatus());
  });

  app.ports.invalidateAccount.subscribe(async () => {
    try {
      await invalidateAccount();
    } catch (err) {
      if (err.isError && err.isError === true) {
        // Deal with scatter error.
        console.error(err);
      }
    }
    app.ports.receiveWalletStatus.send(createResponseStatus());
  });

  app.ports.pushAction.subscribe(async ({ account, action, payload }) => {
    let response = createPushActionReponse(200, action);
    try {
      const { eosjsClient } = getScatter();
      const contract = await eosjsClient.contract(account);
      await contract[action](payload);
    } catch (err) {
      if (err.isError && err.isError === true) {
        // Deal with scatter error.
        const { code, type, message } = err;
        response = createPushActionReponse(code, action, type, message);
      }
    }
    app.ports.receivePushActionResponse.send(response);
  });

  app.ports.generateKeys.subscribe(async () => {
    // Create a new random private key
    let privateWif
    ecc.PrivateKey.randomKey().then(privateKey => {
      privateWif = privateKey.toWif()
      // Convert to a public key
      var pubkey = ecc.PrivateKey.fromString(privateWif).toPublic().toString()

      var keys = { privateKey: privateWif, publicKey: pubkey }
      app.ports.receiveKeys.send(keys);
    })
  });

  updateElm(app);
});

document.addEventListener('scatterLoaded', () => {
  const { scatter } = window;

  // Setting window.scatter to null is recommended.
  window.scatter = null;

  const eosjs = scatter.eos(scatterConfig, eos, eosjsConfig, 'https');
  let scatterState = {
    scatterClient: scatter,
    eosjsClient: eosjs,
    account: '',
    authority: '',
  };

  if (scatter.identity) {
    const { authority, name } = getAuthInfo(scatter.identity);
    scatterState = {
      ...scatterState,
      account: name,
      authority,
    };
  }

  updateScatter(scatterState);
  const app = getElm();
  app.ports.receiveWalletStatus.send(createResponseStatus());
});

// TODO(heejae): This function is a temporary work cause it makes an assumption that
// elm and scatter finish loading after 0.5 seconds from beginning.
// Need to find a good way to handle scatter not found.
window.setTimeout(
  () => {
    const { scatterClient } = getScatter();
    if (!scatterClient) {
      const app = getElm();
      app.ports.receiveWalletStatus.send(createResponseStatus());
    }
  },
  500,
);
