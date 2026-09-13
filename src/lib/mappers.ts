import type { User } from '@supabase/supabase-js';
import { CommunityPost, Creator, CuratorList, ListSpot, MagazineArticle, Place, PostComment, UserSession } from '../types';
import { toEnglishAddress } from './englishAddress';

export function mapPlace(row: any): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: toEnglishAddress(row.address, { area: row.area }),
    area: row.area,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    photoUrl: row.photo_url,
    photos: row.photos || undefined,
    priceRange: row.price_range,
    rating: Number(row.rating),
    reviewCount: row.review_count ?? 0,
    representativeTreatment: row.representative_treatment,
    treatmentIds: row.treatment_ids || [],
    language: row.language || [],
    foreignerFriendly: Boolean(row.foreigner_friendly),
    aiPick: row.ai_pick ?? undefined,
    creatorPick: row.creator_pick ?? undefined,
    communityPick: row.community_pick ?? undefined,
    bookingUrl: row.booking_url ?? undefined,
    whyPeopleLikeIt: row.why_people_like_it || undefined,
    nearbyWellness: row.nearby_wellness || undefined,
    medicalTourismMatch: row.medical_tourism_match || undefined,
  };
}

export function mapCreator(row: any, picksCount?: number): Creator {
  return {
    id: row.id,
    user_id: row.user_id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio || '',
    avatar_url: row.avatar_url || '',
    instagram_url: row.instagram_url ?? undefined,
    tiktok_url: row.tiktok_url ?? undefined,
    website_url: row.website_url ?? undefined,
    picks_count: picksCount ?? row.picks_count ?? 0,
    created_at: row.created_at,
  };
}

export function mapCuratorList(row: any, spotCount?: number): CuratorList {
  return {
    id: row.id,
    curator_id: row.curator_id,
    title: row.title,
    description: row.description ?? undefined,
    cover_photo_url: row.cover_photo_url ?? undefined,
    spot_count: spotCount ?? row.spot_count ?? 0,
    created_at: row.created_at,
  };
}

export function mapListSpot(row: any): ListSpot {
  return {
    id: row.id,
    list_id: row.list_id,
    place_id: row.place_id,
    // No FK/join to `places` (it's an intentionally empty cache) — place data is
    // captured as a snapshot at write time instead. See supabase/creators_schema.sql.
    place: { ...(row.place_snapshot ?? {}), id: row.place_id },
    note: row.note ?? undefined,
    position: row.position ?? 0,
    created_at: row.created_at,
  };
}

export function mapCommunityPost(
  row: any,
  counts?: { likeCount?: number; commentCount?: number },
  likedByMe?: boolean
): CommunityPost {
  return {
    id: row.id,
    authorId: row.author_id ?? undefined,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url || '',
    placeId: row.place_id ?? undefined,
    placeName: row.place_name ?? undefined,
    treatmentName: row.treatment_name ?? undefined,
    category: row.category,
    text: row.text,
    photos: row.photos || undefined,
    rating: row.rating != null ? Number(row.rating) : undefined,
    createdAt: row.created_at,
    likeCount: counts?.likeCount ?? row.post_likes?.[0]?.count ?? 0,
    commentCount: counts?.commentCount ?? row.post_comments?.[0]?.count ?? 0,
    likedByMe,
  };
}

export function mapMagazineArticle(row: any): MagazineArticle {
  return {
    id: row.id,
    curatorId: row.curator_id ?? undefined,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url || undefined,
    kind: row.kind,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    imageUrl: row.image_url,
    minutes: row.minutes,
    createdAt: row.created_at,
  };
}

export function mapPostComment(row: any): PostComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id ?? undefined,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url || '',
    text: row.text,
    createdAt: row.created_at,
  };
}

export function mapAuthSession(user: User, creator?: Creator | null): UserSession {
  const meta = user.user_metadata || {};
  const googleIdentity = user.identities?.find((identity) => identity.provider === 'google');
  const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Guest';
  const avatar =
    meta.avatar_url ||
    meta.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D49A9A&color=fff`;

  return {
    isLoggedIn: true,
    user: {
      id: user.id,
      google_id: String(googleIdentity?.id || meta.sub || user.id),
      email: user.email || '',
      name,
      avatar_url: avatar,
    },
    creator: creator || undefined,
  };
}
