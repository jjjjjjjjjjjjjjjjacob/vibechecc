import { forwardRef, useEffect, useState } from 'react';
import type { Vibe, User, EmojiRating } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface VibeShareCanvasProps {
  vibe: Vibe;
  author?: User;
  ratings?: EmojiRating[];
  shareUrl?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  platform?: 'instagram' | 'tiktok' | 'twitter';
}

export const VibeShareCanvas = forwardRef<HTMLDivElement, VibeShareCanvasProps>(
  ({ vibe, author, ratings = [], shareUrl }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
      if (shareUrl) {
        // Generate QR code as data URL
        QRCode.toDataURL(shareUrl, {
          width: 128,
          margin: 0,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
          .then((url) => {
            setQrCodeUrl(url);
          })
          .catch((_error) => {
            // Don't let QR code failure block the rest
            setQrCodeUrl('');
          });
      }
    }, [shareUrl]);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
        : 0;

    const topEmojis = ratings
      .reduce(
        (acc, rating) => {
          const existing = acc.find((e) => e.emoji === rating.emoji);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ emoji: rating.emoji, count: 1 });
          }
          return acc;
        },
        [] as { emoji: string; count: number }[]
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const displayName = computeUserDisplayName(author);
    const avatarUrl = getUserAvatarUrl(author);
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          height: '1920px',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background:
            'linear-gradient(135deg, #f0f4f8 0%, #ffffff 50%, #e6f2ff 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <div
            style={{
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ fontSize: '72px', fontWeight: 'bold', color: '#3b82f6' }}
            >
              vibechecc
            </div>
            <div style={{ fontSize: '36px', color: '#64748b' }}>
              share your vibe
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              border: '4px solid rgba(59, 130, 246, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '48px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              {/* Author section */}
              <div
                style={{
                  marginBottom: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                }}
              >
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    border: '4px solid rgba(59, 130, 246, 0.2)',
                    overflow: 'hidden',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: '600',
                      color: '#1f2937',
                    }}
                  >
                    {displayName}
                  </div>
                  {author?.username && (
                    <div style={{ fontSize: '28px', color: '#64748b' }}>
                      @{author.username}
                    </div>
                  )}
                </div>
              </div>

              {/* Vibe content */}
              <div style={{ marginBottom: '32px', flex: 1 }}>
                <h2
                  style={{
                    marginBottom: '24px',
                    fontSize: '60px',
                    fontWeight: 'bold',
                    lineHeight: '1.2',
                    color: '#1f2937',
                  }}
                >
                  {vibe.title}
                </h2>
                <p
                  style={{
                    fontSize: '36px',
                    lineHeight: '1.6',
                    color: 'rgba(31, 41, 55, 0.9)',
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {vibe.description}
                </p>
              </div>

              {/* Tags */}
              {vibe.tags && vibe.tags.length > 0 && (
                <div
                  style={{
                    marginBottom: '32px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  {vibe.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        padding: '12px 24px',
                        fontSize: '28px',
                        fontWeight: '500',
                        color: '#3b82f6',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Emoji reactions */}
              {topEmojis.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div
                    style={{
                      marginBottom: '16px',
                      fontSize: '28px',
                      fontWeight: '500',
                      color: '#64748b',
                    }}
                  >
                    top reactions
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {topEmojis.map(({ emoji, count }) => (
                      <div
                        key={emoji}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '9999px',
                          backgroundColor: '#f3f4f6',
                          padding: '12px 24px',
                        }}
                      >
                        <span style={{ fontSize: '48px' }}>{emoji}</span>
                        <span style={{ fontSize: '28px', fontWeight: '600' }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div
                style={{
                  marginBottom: '32px',
                  display: 'flex',
                  gap: '32px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span style={{ fontSize: '36px', fontWeight: '600' }}>
                    {ratings.length} reviews
                  </span>
                </div>
                {averageRating > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="#3b82f6"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span style={{ fontSize: '36px', fontWeight: '600' }}>
                      {averageRating.toFixed(1)} rating
                    </span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '28px',
                  color: '#64748b',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{format(new Date(vibe.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Footer with QR code */}
          <div
            style={{
              marginTop: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: '500',
                  color: '#1f2937',
                }}
              >
                scan to view full vibe
              </div>
              <div style={{ fontSize: '28px', color: '#64748b' }}>
                vibechecc.app
              </div>
            </div>
            {qrCodeUrl && (
              <div
                style={{
                  overflow: 'hidden',
                  borderRadius: '16px',
                  backgroundColor: 'white',
                  padding: '16px',
                }}
              >
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  style={{ height: '128px', width: '128px' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

VibeShareCanvas.displayName = 'VibeShareCanvas';
