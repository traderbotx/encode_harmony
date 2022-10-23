import React from 'react';
import { View, Dimensions, Text, ScrollView, ActivityIndicator, TextInput, Image, FlatList, TouchableHighlight } from 'react-native';
import { Button } from 'react-native-elements';
import evmLib from '../evmLib';
import Lib from '../Lib';
import Modal from 'modal-enhanced-react-native-web';
import screen from '../screen';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';

const vp = screen.vp;
const MAIN_COL = '#00AEEA';


class Manage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'busy',
      nftDatas: [],
      nftIndex: 0,
      power: '1',
      atkVal: 3,
      defVal: 3,
      magVal: 3,
      nftNeedApprove: false
    };
  }

  async componentDidMount() {
    await this.getUserData();
    await this.refreshNFTData();
  }

  componentWillUnmount() {
  }

  async getUserData() {
    this.setState({ busyGetUserData: true });
    try {
      const data = await evmLib.getData();
      const userData = await evmLib.getUserData(data.battles);

      const nftDatas = userData.ownedNFTDatas;
      const battles = data.battles;
      const pendingList = userData.pendingList;

      this.setState({ nftDatas, battles, pendingList });
    } catch (err) {

    }
    this.setState({ busyGetUserData: false });
  }

  async switchNFT(delta) {
    if (delta < 0) delta = -1; else delta = 1;
    const i = this.state.nftIndex + delta;
    if (i < 0 || i >= this.state.nftDatas.length) return;
    this.setState({ nftIndex: i });
    await this.refreshNFTData();
  }

  async refreshNFTData() {
    await Lib.delay(500);
    const nftDatas = this.state.nftDatas;
    const battles = this.state.battles;

    if (nftDatas.length > 0) {
      const index = this.state.nftIndex;
      if (index >= nftDatas.length) index = nftDatas.length - 1;
      const nftData = nftDatas[index];

      let condition = nftData.condition;
      if (condition === 'battle') condition += (' #' + nftData.battleId + ' faction #' + nftData.factionId);

      const data = await evmLib.getNFTData(nftData.id, battles);

      let imgUrl = false;
      let imgName = false;

      if (data.metadata && data.metadata.image) {
        imgUrl = data.metadata.image;
        imgName = data.metadata.name;
      }

      console.log({ data, nftData });
      this.setState({
        nftNeedApprove: data.nftNeedApprove,
        nftCurrentAction: condition.toUpperCase(),
        nftCurrentCondition: nftData.condition,
        nftCurrentBattleId: nftData.battleId,
        nftCurrentFactionId: nftData.factionId,
        nftId: data.nftId,
        nftPowVal: data.powVal,
        nftAtkVal: data.atkVal,
        nftDefVal: data.defVal,
        nftMagVal: data.magVal,
        nftLucVal: data.lucVal
      });
    }
  }

  async mintNFT() {
    this.setState({ modalVisible: true, txHash: null, txError: null });
    const power = this.state.power;
    const atkVal = this.state.atkVal;
    const defVal = this.state.defVal;
    const magVal = this.state.magVal;

    // validate
    try {
      const powerStr = power + '00';
      const txHash = await evmLib.mintNFT(powerStr, atkVal, defVal, magVal);
      await this.getUserData();
      await this.refreshNFTData();
      this.setState({ txHash });
    } catch (err) {
      this.setState({ txError: true });
      console.error(err);
    }
  }

  async burnNFT() {
    this.setState({ modalVisible: true, txHash: null, txError: null });
    const nftDatas = this.state.nftDatas;
    const nftIndex = this.state.nftIndex;
    if (nftDatas.length === 0) return;
    const selectedNFTId = nftDatas[nftIndex].id;
    try {
      const txHash = await evmLib.burnNFT(selectedNFTId);
      await this.getUserData();
      await this.refreshNFTData();
      this.setState({ txHash });
    } catch (err) {
      this.setState({ txError: true });
    }
  }

  async nextBattle() {
    this.setState({ modalVisible: true, txHash: null, txError: null });
    try {
      const txHash = await evmLib.nextBattle();
      await this.getUserData();
      await this.refreshNFTData();
      this.setState({ txHash });
    } catch (err) {
      this.setState({ txError: true });
      console.error(err);
    }
  }

  async approveNFT() {
    const nftDatas = this.state.nftDatas;
    const nftIndex = this.state.nftIndex;
    if (nftDatas.length === 0) return;
    this.setState({ modalVisible: true, txHash: null, txError: null });

    const selectedNFTId = nftDatas[nftIndex].id;
    const curBattle = this.state.battles[0].address;
    try {
      const txHash = await evmLib.approveNFT(selectedNFTId, curBattle);
      await this.getUserData();
      await this.refreshNFTData();
      this.setState({ txHash });
    } catch (err) {
      this.setState({ txError: true });
    }
  }

  async joinBattle(factionId) {
    const nftDatas = this.state.nftDatas;
    const nftIndex = this.state.nftIndex;
    if (nftDatas.length === 0) return;
    this.setState({ modalVisible: true, txHash: null, txError: null });

    const selectedNFTId = nftDatas[nftIndex].id;
    const curBattle = this.state.battles[0].address;
    try {
      const txHash = await evmLib.joinBattle(selectedNFTId, factionId, curBattle);
      await this.getUserData();
      await this.refreshNFTData();
      this.setState({ txHash });
    } catch (err) {
      this.setState({ txError: true });
    }
  }

  async leaveBattle() {
    const nftDatas = this.state.nftDatas;
    const nftIndex = this.state.nftIndex;
    if (nftDatas.length === 0) return;
    this.setState({ modalVisible: true, txHash: null, txError: null });

    const selectedNFTId = nftDatas[nftIndex].id;
    const nftCurrentBattleId = this.state.nftCurrentBattleId;
    const battles = this.state.battles;
    let addressBattle;
    for (let i = 0; i < battles.length; i++) {
      if (battles[i].id === nftCurrentBattleId) {
        addressBattle = battles[i].address;
      }
    }

    try {
      const txHash = await evmLib.leaveBattle(selectedNFTId, addressBattle);
      await this.getUserData();
      await this.refreshNFTData();
      this.setState({ txHash });
    } catch (err) {
      console.error(err);
      this.setState({ txError: true });
    }
  }

  renderModal() {
    let indicator = <ActivityIndicator />;
    let msg = 'PROCESS TX';
    if (this.state.txHash) {
      msg = 'PROCESS TX DONE';
      const txHash = this.state.txHash;
      indicator = <Button type="outline" title='OPEN ON EXPLORER' onPress={() => Lib.openUrl(evmLib.EURL + '/tx/' + txHash)} />
    } else if (this.state.txError) {
      msg = 'PROCESS TX FAIL';
    }

    return (
      <Modal
        isVisible={this.state.modalVisible}
        onBackdropPress={() => this.setState({ modalVisible: false })}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, minWidth: 300 }}>
            <Text style={{ textAlign: 'center' }}>{msg}</Text>
            <Text> </Text>
            <View>
              {indicator}
              <Text> </Text>
              <Button type="outline" title='CLOSE' onPress={() => this.setState({ modalVisible: false })} />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  renderOwned() {
    const pw = (20 * vp);
    let url = 'https://res.cloudinary.com/dey55ubjm/image/upload/v1666530650/yw/warrior1.png';

    const nftId = this.state.nftId ? '#' + this.state.nftId : '#0';
    const powVal = this.state.nftPowVal ? this.state.nftPowVal : 0;
    const atkVal = this.state.nftAtkVal ? this.state.nftAtkVal : 0;
    const defVal = this.state.nftDefVal ? this.state.nftDefVal : 0;
    const magVal = this.state.nftMagVal ? this.state.nftMagVal : 0;
    const lucVal = this.state.nftLucVal ? this.state.nftLucVal : 0;

    const stats = [
      { title: 'ID', value: nftId },
      { title: 'ATTACK', value: atkVal },
      { title: 'DEFENSE', value: defVal },
      { title: 'MAGIC', value: magVal },
      { title: 'LUCK', value: lucVal },
      { title: 'POWER', value: powVal + ' $ONE' },
    ];

    let enableBurnNFT = false;

    const numNFT = this.state.nftDatas.length;
    let nftIndex = this.state.nftIndex + 1;
    if (numNFT === 0) nftIndex = 0;
    const selectStr = '' + nftIndex + '/' + numNFT;
    const select = this.renderSelect(selectStr, () => this.switchNFT(-1), () => this.switchNFT(+1));

    let action = '';
    if (this.state.nftCurrentAction) action = this.state.nftCurrentAction;

    if (numNFT > 0 && this.state.nftCurrentCondition === 'idle') {
      enableBurnNFT = true;
    }

    return (
      <View style={{ flex: 1, borderWidth: 1, padding: 10, borderColor: 'gainsboro' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 10 }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>OWNED WARRIORS</Text>
        </View>
        <View style={{ backgroundColor: MAIN_COL, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            style={{ width: pw, height: pw }}
            source={{ uri: url }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text> </Text>
            <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>{action}</Text>
            <Text> </Text>
            {stats.map((item, i) => {
              return (
                <Text style={{ textAlign: 'center' }}>{item.title}: {item.value}</Text>
              );
            })}
          </View>
          <View>{select}</View>
          <View style={{ paddingTop: 10 }}>
            <Button disabled={!enableBurnNFT} type='outline' title='Burn NFT' onPress={() => this.burnNFT()} />
          </View>
        </View>
      </View>
    );

  }

  renderSelect(txt, cbLeft, cbRight) {
    return (
      <View style={{ flexDirection: 'row', paddingTop: 10, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Button type='outline' disabled={false}
            icon={
              <Icon
                name="arrow-left"
              />
            }
            onPress={() => cbLeft()} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ textAlign: 'center' }}>{txt}</Text></View>
        <View style={{ flex: 1 }}>
          <Button type='outline' disabled={false}
            icon={
              <Icon
                name="arrow-right"
              />
            }
            onPress={() => cbRight()}
          />
        </View>
      </View>
    );
  }

  renderPendingList() {
    let rowsView;
    const height = this.state.rowsViewHeight2;
    const rows = this.state.pendingList ? this.state.pendingList : [];
    if (height > 0) {
      rowsView = <View style={{
        flex: 1,
        maxHeight: height
      }}>
        <FlatList
          style={{ paddingVertical: 10 }}
          data={rows}
          renderItem={obj => {
            const pl = obj.item;
            return (
              <View style={{ padding: 10 }}>
                <View style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}>
                  <Text style={{ textAlign: 'center' }}>{pl.amount + ' $ONE'}</Text>
                  <Text style={{ textAlign: 'center' }}>Can be claimed after epoch {pl.claimTime}</Text>
                  <Text> </Text>
                  <Button type='outline' title='Claim' onPress={() => this.claimPendingWithdraw(pl.id)} />
                </View>
              </View>
            );
          }}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    } else {
      rowsView = <View onLayout={e => {
        const rowsViewHeight = e.nativeEvent.layout.height;
        if (rowsViewHeight > 100) this.setState({ rowsViewHeight2: rowsViewHeight });
      }} style={{ flex: 1 }} />
    }

    return (
      <View style={{ flex: 1, borderWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ flex: 1 }}>{rowsView}</View>
        <View style={{ borderTopWidth: 1, borderColor: 'gainsboro', padding: 10 }}>
          <Button type='outline' title='Back' onPress={() => this.setState({ showPendingList: false })} />
        </View>
      </View>
    );
  }

  switchStat(key, delta) {
    if (key === 'ATK') {
      if (delta < 0 && this.state.atkVal > 0) {
        const newState = { atkVal: (this.state.atkVal - 1) };
        if (this.state.magVal < this.state.defVal) {
          newState.magVal = (this.state.magVal + 1);
        } else {
          newState.defVal = (this.state.defVal + 1);
        }
        this.setState(newState)
      }

      if (delta > 0 && this.state.atkVal < 5) {
        const newState = { atkVal: (this.state.atkVal + 1) };
        if (this.state.magVal > this.state.defVal) {
          newState.magVal = (this.state.magVal - 1);
        } else {
          newState.defVal = (this.state.defVal - 1);
        }
        this.setState(newState)
      }
    }

    if (key === 'DEF') {
      if (delta < 0 && this.state.defVal > 0) {
        const newState = { defVal: (this.state.defVal - 1) };
        if (this.state.magVal < this.state.atkVal) {
          newState.magVal = (this.state.magVal + 1);
        } else {
          newState.atkVal = (this.state.atkVal + 1);
        }
        this.setState(newState)
      }
      if (delta > 0 && this.state.defVal < 5) {
        const newState = { defVal: (this.state.defVal + 1) };
        if (this.state.magVal > this.state.atkVal) {
          newState.magVal = (this.state.magVal - 1);
        } else {
          newState.atkVal = (this.state.atkVal - 1);
        }
        this.setState(newState)
      }
    }

    if (key === 'MAG') {
      if (delta < 0 && this.state.magVal > 0) {
        const newState = { magVal: (this.state.magVal - 1) };
        if (this.state.defVal < this.state.atkVal) {
          newState.defVal = (this.state.defVal + 1);
        } else {
          newState.atkVal = (this.state.atkVal + 1);
        }
        this.setState(newState)
      }
      if (delta > 0 && this.state.defVal < 5) {
        const newState = { magVal: (this.state.magVal + 1) };
        if (this.state.defVal > this.state.atkVal) {
          newState.defVal = (this.state.defVal - 1);
        } else {
          newState.atkVal = (this.state.atkVal - 1);
        }
        this.setState(newState)
      }
    }

  }

  renderSummon() {
    if (this.state.showPendingList) return this.renderPendingList();
    const pw = (20 * vp);
    let url = 'https://res.cloudinary.com/dey55ubjm/image/upload/v1666530650/yw/warrior2.png';

    const stats = [
      { title: 'ATK', value: this.state.atkVal },
      { title: 'DEF', value: this.state.defVal },
      { title: 'MAG', value: this.state.magVal }
    ];

    let enablePendingWithdraw = false;
    const pendingList = this.state.pendingList;
    if (pendingList && pendingList.length > 0) {
      enablePendingWithdraw = true;
    }

    return (
      <View style={{ flex: 1, borderWidth: 1, padding: 10, borderColor: 'gainsboro' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 10 }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>MINT NEW WARRIOR</Text>
        </View>
        <View style={{ backgroundColor: MAIN_COL, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            style={{ width: pw, height: pw }}
            source={{ uri: url }}
          />
        </View>
        <View>
          {stats.map((item, i) => {
            const selectStr = item.title + ': ' + item.value;
            return this.renderSelect(selectStr, () => this.switchStat(item.title, -1), () => this.switchStat(item.title, +1));
          })}
        </View>
        <View style={{ flex: 1 }}></View>
        <View style={{ paddingTop: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center' }}>Delegate more $ONE for more power!</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 10, justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextInput value={this.state.power} onChangeText={txt => this.setState({ power: txt })}
              keyboardType='numeric' maxLength={7} style={{ borderWidth: 1, padding: 5, borderColor: 'gainsboro' }} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text>00 $ONE</Text>
          </View>
        </View>
        <View style={{ paddingTop: 10 }}>
          <Button title='Mint NFT' onPress={() => this.mintNFT()} />
        </View>
        <View style={{ paddingTop: 10 }}>
          <Button disabled={!enablePendingWithdraw} type='outline' title='Pending Withdraw' onPress={() => this.setState({ showPendingList: true })} />
        </View>
      </View>
    );

  }

  renderFaction(battle, faction, isCurrentBattle) {
    let btn;

    const battleId = battle.id;
    const factionId = faction.id;
    const nftCondition = this.state.nftCurrentCondition;
    const nftBattleId = this.state.nftCurrentBattleId;
    const nftFactionId = this.state.nftCurrentFactionId;

    const inThisFaction = (battleId + '' === nftBattleId + '' && factionId + '' === nftFactionId + '');

    let isWinner = false;
    let bgColor = 'gainsboro';
    if (battle.finished && factionId === battle.winner) {
      isWinner = true;
      bgColor = 'green';
    } else if (battle.finished) {
      bgColor = 'red';
    }

    // console.log({ battleId, factionId, nftBattleId, nftFactionId, inThisFaction });
    // nftCurrentAction: condition.toUpperCase(),
    // nftCurrentCondition: nftData.condition,
    // nftCurrentBattleId: nftData.battleId,
    // nftCurrentFactionId: nftData.factionId,

    if (isCurrentBattle) {
      if (nftCondition === 'battle' && inThisFaction) {
        btn = <Button disabled={true} type='outline' title='Leave' onPress={() => this.leaveBattle()} />;
      } else if (nftCondition === 'idle' && this.state.nftNeedApprove) {
        btn = <Button type='outline' title='Approve' onPress={() => this.approveNFT()} />;
      } else if (nftCondition === 'idle') {
        btn = <Button type='outline' title='Join' onPress={() => this.joinBattle(factionId)} />;
      }
    } else {
      if (nftCondition === 'battle' && inThisFaction) {
        btn = <Button disabled={false} type='outline' title='Leave' onPress={() => this.leaveBattle()} />;
      }
    }

    return (
      <View style={{ flex: 1, padding: 5 }}>
        <View style={{ flex: 1, borderWidth: 1, borderColor: 'gainsboro' }}>
          <View style={{ height: (3 * vp), borderTop: 1, flexDirection: 'row', backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
            <Text>FACTION #{factionId}</Text>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={{ fontSize: 24, textAlign: 'center' }}>{faction.pctg}%</Text>
            <Text style={{ textAlign: 'center' }}>WP: {faction.wp}</Text>
            <Text style={{ textAlign: 'center' }}>NFT: {faction.numNFT}</Text>
          </View>
          <View style={{ padding: 5 }}>
            {btn}
          </View>
        </View>
      </View>
    );
  }

  renderBattle(item) {
    const battle = item.item;
    const isCurrentBattle = item.index === 0;
    const status = battle.finished ? ('FACTION #' + battle.winner + ' WIN') : 'ON GOING';
    const prize = battle.prize;

    const factions = battle.factions;

    return (
      <View style={{ padding: 10, borderBottomWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ padding: 10 }}>
          <Text style={{ textAlign: 'center' }}>BATTLE #{battle.id}</Text>
          <Text style={{ fontSize: 24, textAlign: 'center' }}>{battle.enemyName.toUpperCase()}</Text>
          <Text style={{ textAlign: 'center' }}>BOUNTY {prize} $ONE</Text>
          <Text style={{ textAlign: 'center' }}>{status}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {factions.map((faction, i) => {
            return this.renderFaction(battle, faction, isCurrentBattle);
          })}
        </View>
      </View>
    );
  }

  renderKingdom() {
    const busyGetUserData = this.state.busyGetUserData;

    let enableStartNextBattle = false;
    const battles = this.state.battles;
    let nextTime = ' \n ';
    let rows = [];
    if (battles && battles.length > 0) {
      rows = battles;
      rows[0].currrent = true;

      const endTS = rows[0].ts + (3600 * 1);
      nextTime = 'next battle should start after\n' + moment.unix(endTS).format('DD MMM YYYY HH:mm:ss');

      if (moment().unix() >= endTS && !busyGetUserData) enableStartNextBattle = true;
    }

    // console.log('rows:', rows);
    let rowsView;
    const height = this.state.rowsViewHeight;
    if (height > 0) {
      let content;

      if (busyGetUserData) {
        content = <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
      } else {
        content = <FlatList
          style={{ paddingVertical: 10 }}
          data={rows}
          renderItem={item => this.renderBattle(item)}
          keyExtractor={item => item.address}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      }

      rowsView = <View style={{
        flex: 1,
        maxHeight: height
      }}>
        {content}
      </View>
    } else {
      rowsView = <View onLayout={e => {
        console.log(e);
        const rowsViewHeight = e.nativeEvent.layout.height;
        console.log({ rowsViewHeight });
        if (rowsViewHeight > 100) this.setState({ rowsViewHeight });
      }} style={{ flex: 1 }} />
    }

    return (
      <View style={{ flex: 1, borderWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10, borderBottomWidth: 1, borderColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>BATTLES</Text>
        </View>
        <View style={{ flex: 1 }}>
          {rowsView}
        </View>
        <View style={{ padding: 10, borderTopWidth: 1, borderColor: 'gainsboro', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center' }}>{nextTime}</Text>
        </View>
        <View style={{ padding: 10 }}>
          <Button disabled={!enableStartNextBattle} title='Start Next Battle' onPress={() => this.nextBattle()} />
        </View>
      </View>
    );

  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        {this.renderModal()}
        <View style={{ width: (94 * vp) }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              {this.renderSummon()}
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              {this.renderOwned()}
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 2 }}>
              {this.renderKingdom()}
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default Manage;
