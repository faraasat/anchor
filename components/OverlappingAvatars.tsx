// Overlapping Avatars - Show multiple circle members with activity halos
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ActivityHaloAvatar } from './ActivityHaloAvatar';
import type { CircleMember, ActivityHalo } from '@/types/phase8';
import { Typography } from '@/constants/theme';

interface OverlappingAvatarsProps {
  members: CircleMember[];
  halos?: Record<string, ActivityHalo>; // userId -> halo
  maxVisible?: number;
  size?: number;
  onPress?: () => void;
}

export function OverlappingAvatars({
  members,
  halos = {},
  maxVisible = 4,
  size = 40,
  onPress,
}: OverlappingAvatarsProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      {visibleMembers.map((member, index) => {
        const initials = member.profile?.fullName
          ? member.profile.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : member.profile?.email?.substring(0, 2).toUpperCase() || '?';

        return (
          <View
            key={member.id}
            style={[
              styles.avatarWrapper,
              {
                marginLeft: index === 0 ? 0 : -(size * 0.3),
                zIndex: members.length - index,
              },
            ]}
          >
            <ActivityHaloAvatar
              userId={member.userId}
              avatarUrl={member.profile?.avatarUrl}
              initials={initials}
              halo={halos[member.userId]}
              size={size}
              showHalo={true}
            />
          </View>
        );
      })}

      {/* Show +N indicator for remaining members */}
      {remainingCount > 0 && (
        <View
          style={[
            styles.remainingBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.3),
            },
          ]}
        >
          <Text style={[styles.remainingText, { fontSize: size * 0.35 }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  remainingBadge: {
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  remainingText: {
    color: '#FFFFFF',
    fontWeight: Typography.weight.bold,
  },
});
