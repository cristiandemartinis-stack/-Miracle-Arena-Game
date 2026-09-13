import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function App() {
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState('THE YARD · ROUND 1');
  const [playerX, setPlayerX] = useState(22);
  const [enemyX, setEnemyX] = useState(68);
  const [flash, setFlash] = useState(false);
  const comboTimer = useRef(null);

  useEffect(() => {
    const regen = setInterval(() => setEnergy((e) => clamp(e + 3, 0, 100)), 700);
    return () => clearInterval(regen);
  }, []);

  const distance = useMemo(() => Math.abs(enemyX - playerX), [enemyX, playerX]);

  const resetComboSoon = () => {
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 850);
  };

  const enemyCounter = () => {
    if (Math.random() < 0.34 && enemyHp > 0 && playerHp > 0) {
      setTimeout(() => {
        setPlayerHp((hp) => clamp(hp - 8, 0, 100));
        setMessage('COUNTER!');
      }, 260);
    }
  };

  const attack = () => {
    if (playerHp <= 0 || enemyHp <= 0) return;
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    resetComboSoon();
    if (distance > 34) {
      setMessage('TOO FAR');
      return;
    }
    const dmg = nextCombo >= 3 ? 18 : 10;
    setEnemyHp((hp) => clamp(hp - dmg, 0, 100));
    setFlash(true);
    setTimeout(() => setFlash(false), 90);
    setMessage(nextCombo >= 3 ? 'COMBO FINISHER!' : 'CLEAN HIT');
    enemyCounter();
  };

  const heavy = () => {
    if (energy < 35 || playerHp <= 0 || enemyHp <= 0) return;
    setEnergy((e) => e - 35);
    if (distance <= 38) {
      setEnemyHp((hp) => clamp(hp - 26, 0, 100));
      setMessage('POWER SHOT');
      setFlash(true);
      setTimeout(() => setFlash(false), 120);
    } else {
      setMessage('POWER SHOT MISSED');
    }
  };

  const dodge = () => {
    if (energy < 20 || playerHp <= 0) return;
    setEnergy((e) => e - 20);
    setPlayerX((x) => clamp(x - 7, 8, 55));
    setMessage('DODGE');
  };

  const move = (delta) => {
    if (playerHp <= 0 || enemyHp <= 0) return;
    setPlayerX((x) => clamp(x + delta, 8, 58));
  };

  useEffect(() => {
    if (enemyHp <= 0) setMessage('K.O. · VICTORY');
    if (playerHp <= 0) setMessage('K.O. · DEFEAT');
  }, [enemyHp, playerHp]);

  const restart = () => {
    setPlayerHp(100);
    setEnemyHp(100);
    setEnergy(100);
    setCombo(0);
    setPlayerX(22);
    setEnemyX(68);
    setMessage('THE YARD · ROUND 1');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <View style={styles.hudTop}>
        <View style={styles.fighterHud}>
          <Text style={styles.name}>BOXER</Text>
          <View style={styles.barShell}><View style={[styles.hpBar, { width: `${playerHp}%` }]} /></View>
        </View>
        <View style={styles.centerHud}>
          <Text style={styles.brand}>MIRACLE ARENA</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={styles.fighterHud}>
          <Text style={[styles.name, { textAlign: 'right' }]}>RIVAL</Text>
          <View style={styles.barShell}><View style={[styles.enemyBar, { width: `${enemyHp}%` }]} /></View>
        </View>
      </View>

      <View style={styles.scene}>
        <View style={styles.skyline}>
          <View style={[styles.building, { width: '16%', height: '70%', left: '3%' }]} />
          <View style={[styles.building, { width: '12%', height: '48%', left: '20%' }]} />
          <View style={[styles.building, { width: '22%', height: '78%', left: '34%' }]} />
          <View style={[styles.building, { width: '16%', height: '58%', left: '60%' }]} />
          <View style={[styles.building, { width: '20%', height: '72%', left: '78%' }]} />
        </View>
        <View style={styles.fence} />
        <View style={styles.ground} />
        <View style={styles.roadLine} />

        <View style={[styles.fighter, styles.player, { left: `${playerX}%` }]}>
          <View style={styles.head} />
          <View style={styles.torso} />
          <View style={[styles.glove, styles.leftGlove]} />
          <View style={[styles.glove, styles.rightGlove]} />
          <View style={styles.legs} />
        </View>

        <View style={[styles.fighter, styles.enemy, { left: `${enemyX}%` }, flash && styles.hitFlash]}>
          <View style={[styles.head, styles.enemyHead]} />
          <View style={[styles.torso, styles.enemyTorso]} />
          <View style={[styles.glove, styles.enemyGlove, styles.leftGlove]} />
          <View style={[styles.glove, styles.enemyGlove, styles.rightGlove]} />
          <View style={styles.legs} />
        </View>

        <View style={styles.energyWrap}>
          <Text style={styles.energyLabel}>ENERGY {energy}</Text>
          <View style={styles.energyShell}><View style={[styles.energyBar, { width: `${energy}%` }]} /></View>
        </View>

        <View style={styles.controls}>
          <View style={styles.movePad}>
            <TouchableOpacity style={styles.moveButton} onPress={() => move(-6)}><Text style={styles.controlText}>◀</Text></TouchableOpacity>
            <TouchableOpacity style={styles.moveButton} onPress={() => move(6)}><Text style={styles.controlText}>▶</Text></TouchableOpacity>
          </View>
          <View style={styles.actionPad}>
            <TouchableOpacity style={[styles.action, styles.dodge]} onPress={dodge}><Text style={styles.actionText}>DODGE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.heavy]} onPress={heavy}><Text style={styles.actionText}>POWER</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.attack]} onPress={attack}><Text style={styles.actionText}>ATTACK</Text></TouchableOpacity>
          </View>
        </View>

        {(playerHp <= 0 || enemyHp <= 0) && (
          <TouchableOpacity style={styles.restart} onPress={restart}>
            <Text style={styles.restartText}>RESTART</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090b0f' },
  hudTop: { height: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 16, backgroundColor: '#0c1017' },
  fighterHud: { flex: 1 },
  centerHud: { width: 220, alignItems: 'center' },
  brand: { color: '#f5c451', fontWeight: '900', letterSpacing: 2, fontSize: 18 },
  message: { color: '#d7dde8', fontSize: 11, marginTop: 4, letterSpacing: 1.5 },
  name: { color: '#f5f7fa', fontWeight: '800', fontSize: 12, marginBottom: 5 },
  barShell: { height: 10, backgroundColor: '#242b35', borderRadius: 999, overflow: 'hidden' },
  hpBar: { height: '100%', backgroundColor: '#42d47d' },
  enemyBar: { height: '100%', backgroundColor: '#e25353', alignSelf: 'flex-end' },
  scene: { flex: 1, overflow: 'hidden', backgroundColor: '#c86447' },
  skyline: { position: 'absolute', left: 0, right: 0, top: 0, height: '45%', backgroundColor: '#d06b51' },
  building: { position: 'absolute', bottom: 0, backgroundColor: '#342f39', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  fence: { position: 'absolute', left: 0, right: 0, top: '41%', height: 7, backgroundColor: '#24272e', opacity: 0.9 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: '#252a30' },
  roadLine: { position: 'absolute', left: '8%', right: '8%', bottom: '28%', height: 4, backgroundColor: '#c79f37', opacity: 0.7 },
  fighter: { position: 'absolute', bottom: '22%', width: 62, height: 142, alignItems: 'center' },
  player: { transform: [{ scaleX: 1.03 }] },
  enemy: { transform: [{ scaleX: -1.03 }] },
  hitFlash: { opacity: 0.45 },
  head: { width: 26, height: 29, borderRadius: 13, backgroundColor: '#c99674', marginTop: 3 },
  enemyHead: { backgroundColor: '#9f755c' },
  torso: { width: 38, height: 58, marginTop: 2, borderRadius: 10, backgroundColor: '#d6812f' },
  enemyTorso: { backgroundColor: '#8f2634' },
  glove: { position: 'absolute', top: 46, width: 19, height: 19, borderRadius: 10, backgroundColor: '#e1b739' },
  enemyGlove: { backgroundColor: '#d84b4b' },
  leftGlove: { left: 2 },
  rightGlove: { right: 2 },
  legs: { width: 28, height: 42, marginTop: 3, backgroundColor: '#13171c', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  energyWrap: { position: 'absolute', left: 18, bottom: 18, width: 180 },
  energyLabel: { color: '#e7ebf2', fontSize: 10, fontWeight: '700', marginBottom: 5 },
  energyShell: { height: 7, backgroundColor: '#1c2430', borderRadius: 999, overflow: 'hidden' },
  energyBar: { height: '100%', backgroundColor: '#4aa3ff' },
  controls: { position: 'absolute', left: 16, right: 16, bottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  movePad: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  moveButton: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#111922cc', borderWidth: 1, borderColor: '#667483', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#fff', fontSize: 25, fontWeight: '800' },
  actionPad: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  action: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#758292' },
  dodge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1d3347dd' },
  heavy: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#684119dd' },
  attack: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#7b202bdd' },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
  restart: { position: 'absolute', alignSelf: 'center', top: '48%', backgroundColor: '#f5c451', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  restartText: { color: '#111', fontWeight: '900', letterSpacing: 1.5 },
});
