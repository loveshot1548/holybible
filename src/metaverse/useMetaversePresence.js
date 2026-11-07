import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useMetaversePresence(floor, playerName, myPos, seatedInfo) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!supabase || !playerName) return;

    const channel = supabase.channel(`metaverse_${floor}`, {
      config: { presence: { key: playerName } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = [];
        Object.keys(state).forEach((key) => {
          const presence = state[key]?.[0];
          if (presence && presence.name !== playerName) {
            users.push(presence);
          }
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: playerName,
            floor,
            x: myPos[0],
            z: myPos[2],
            seated: Boolean(seatedInfo)
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [floor, playerName]);

  // 내 위치나 착석 상태가 바뀔 때 다른 접속자들에게 좌표 전송
  useEffect(() => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      channelRef.current.track({
        name: playerName,
        floor,
        x: myPos[0],
        z: myPos[2],
        seated: Boolean(seatedInfo)
      });
    }
  }, [myPos, seatedInfo, floor, playerName]);

  return onlineUsers;
}