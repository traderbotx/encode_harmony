import { View, Dimensions, ActivityIndicator, Text } from 'react-native';

let ww = Dimensions.get('window').width;
let hh = Dimensions.get('window').height;

let scr = ww;
if(ww > hh) scr = hh;

const vp = scr / 100;

export default {
  vp
};

