import React from 'react';
import { View, Dimensions, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Button } from 'react-native-elements';
import evmLib from '../evmLib';
import screen from '../screen';
import Icon from 'react-native-vector-icons/FontAwesome';
import Lib from '../Lib';
import Manage from './Manage';

const vp = screen.vp;
const txtColor2 = 'white';
const txtColor1 = '#00AEEA';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false
    };
  }

  async componentDidMount() {
    await this.connectMetamask();
    this.setState({ show: 'home' });
  }

  componentWillUnmount() {
  }

  async connectMetamask() {
    this.setState({ showMetamaskError: false });
    try {
      const connected = await evmLib.detectMetamask();
      if (connected) {
        await evmLib.loadMetamask();
        return this.setState({ connected: true });;
      }
    } catch (err) {
      console.error(err.message);
      if (err.message && err.message === 'Please install Metamask and reload!') {
        this.setState({ showMetamaskError: 'not installed' });
      } else if (err.message && err.message === 'Please connect metamask to right network!') {
        this.setState({ showMetamaskError: 'wrong network' });
      }
    }
    this.setState({ connected: false });;
  }

  renderDisclaimer() {
    const msg = 'The information provided on this website does not constitute investment advice, financial advice, trading advice, or any other sort of advice and you should not treat any of the website`s content as such. Vault Hero does not recommend that any cryptocurrency should be bought, sold, or held by you. Do conduct your own due diligence and consult your financial advisor before making any investment decisions.';
    return (
      <View style={{ paddingVertical: (10 * vp), backgroundColor: '#00AEEA', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: (94 * vp) }}>
          <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: txtColor2 }}>DISCLAIMER</Text>
          <Text> </Text>
          <Text style={{ textAlign: 'center', color: txtColor2 }}>
            {msg}
          </Text>
          <Text> </Text>
          <Text> </Text>
          <Button type='outline' title='Follow Our Twitter' onPress={() => Lib.openUrl('https://twitter.com/vaultheroxyz')} />
        </View>
      </View>
    );
  }

  render() {
    const txtColor = 'white';

    let game = null;
    if (this.state.connected) {
      game = <Manage />;
    } else {
      game = (
        <View style={{
          flex: 1,
          borderWidth: 1, borderColor: 'gainsboro', padding: 5 * vp
        }}>
          <Text style={{ textAlign: 'center' }}>
            Configure your browser to use Yield Warriors:
          </Text>
          <View style={{ height: 10 }} />
          <Button type='outline' title='Install Metamask' onPress={() => Lib.openUrl('https://metamask.io')} />
          <View style={{ height: 10 }} />
          <Button type='outline' title='Switch network to Harmony Testnet' onPress={() => Lib.openUrl('https://chainlist.org/chain/1666700000')} />
          <View style={{ height: 10 }} />
          <Button type='outline' title='Refresh this page' onPress={() => window.location.reload()} />
        </View >

      );
    }

    return (
      <View>
        <View style={{ paddingVertical: (5 * vp), backgroundColor: '#00AEEA', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: (94 * vp) }}>
            <Text style={{ textAlign: 'center', fontSize: 64, fontWeight: 'bold', color: txtColor }}>YIELD WARRIORS</Text>
            <Text> </Text>
            <Text style={{ textAlign: 'center', color: txtColor }}>
              Delegate your $ONE to mint Yield Warrior NFT. Join and strengthen your faction to win pooled interest! Burn the NFT to retrieve 100% of your $ONE anytime!
            </Text>
            <Text> </Text>
          </View>
        </View>
        <View style={{ paddingVertical: (5 * vp), alignItems: 'center', justifyContent: 'center' }}>
          <View style={{}}>
            <View style={{ paddingTop: 10 }}>
              {game}
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default Home;
