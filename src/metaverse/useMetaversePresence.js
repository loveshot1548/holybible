// src/metaverse/useMetaversePresence.js
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CHANNEL_MAP = {
  '1F': 'metaverse_lobby_1f',
  '2F': 'metaverse_cafe_2f',
  '3F': 'metaverse_sanctuary_3f',
  '4F': 'metaverse_parents_4f',
  '5F': 'metaverse_dining_5f',
  '6F': 'metaverse_edu_6f'
};

export function useMetaversePresence(
  floor,
  playerName,
  myPos = [0, 0, 0],
  seatedInfo = null,
  extraState = {}
) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [blessingEvent, setBlessingEvent] = useState(null);
  const channelRef = useRef(null);
  const lastTrackTimeRef = useRef(0);
  const clientIdRef = useRef(
    `peer_${floor}_${playerName || 'guest'}_${Math.random().toString(36).slice(2, 8)}`
  );

  // 로컬에 저장된 내 커스텀 아바타 외형 읽기
  const getSavedAvatar = useCallback(() => {
    try {
      const raw = localStorage.getItem('gtc_metaverse_avatar_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase || !playerName) return;

    const channelName = CHANNEL_MAP[floor] || `metaverse_${floor}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: clientIdRef.current } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = [];
        Object.keys(state).forEach((key) => {
          if (key === clientIdRef.current) return;
          const items = state[key];
          if (items && items.length > 0) {
            users.push(items[items.length - 1]);
          }
        });
        setOnlineUsers(users);
      })
      .on('broadcast', { event: 'holy_blessing' }, ({ payload }) => {
        if (!payload) return;
        setBlessingEvent(payload);
        setTimeout(() => setBlessingEvent(null), 7000);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            clientId: clientIdRef.current,
            name: playerName,
            office: extraState.office || localStorage.getItem('login_user_office') || '성도',
            floor,
            x: Number((myPos?.[0] || 0).toFixed(2)),
            z: Number((myPos?.[2] || 0).toFixed(2)),
            rotY: Number((extraState.rotY || 0).toFixed(2)),
            seated: Boolean(seatedInfo),
            emote: extraState.emote || null,
            chatMsg: extraState.chatMsg || '',
            avatar: extraState.avatar || getSavedAvatar(),
            ts: Date.now()
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [floor, playerName, getSavedAvatar]);

  // ⚡ 200ms 쓰로틀링(Throttling) 위치 및 상태 동기화 — 프레임 드랍 및 네트워크 과부하 원천 방지
  useEffect(() => {
    if (!channelRef.current) return;
    const now = Date.now();
    const isUrgentStateChange = Boolean(extraState.emote || extraState.chatMsg || seatedInfo);

    if (!isUrgentStateChange && now - lastTrackTimeRef.current < 200) {
      return;
    }
    lastTrackTimeRef.current = now;

    channelRef.current
      .track({
        clientId: clientIdRef.current,
        name: playerName,
        office: extraState.office || localStorage.getItem('login_user_office') || '성도',
        floor,
        x: Number((myPos?.[0] || 0).toFixed(2)),
        z: Number((myPos?.[2] || 0).toFixed(2)),
        rotY: Number((extraState.rotY || 0).toFixed(2)),
        seated: Boolean(seatedInfo),
        emote: extraState.emote || null,
        chatMsg: extraState.chatMsg || '',
        avatar: extraState.avatar || getSavedAvatar(),
        ts: now
      })
      .catch(() => {});
  }, [
    myPos?.[0],
    myPos?.[2],
    seatedInfo,
    floor,
    playerName,
    extraState.rotY,
    extraState.emote,
    extraState.chatMsg,
    extraState.office,
    extraState.avatar,
    getSavedAvatar
  ]);

  return onlineUsers;
}