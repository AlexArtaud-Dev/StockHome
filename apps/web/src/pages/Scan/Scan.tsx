import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/Layout/Layout';
import { api, ApiError } from '../../services/api';
import { Container } from '@stockhome/shared';
import styles from './Scan.module.css';

export function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => null);
        }
        tick();
      } catch {
        setError('Camera access denied. Please allow camera permissions.');
      }
    }

    async function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !scanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const jsQR = (await import('jsqr')).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            setScanning(false);
            await handleQrCode(code.data);
            return;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    }

    startCamera().catch(() => null);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stream?.getTracks().forEach((track) => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleQrCode(scanned: string) {
    try {
      try {
        const url = new URL(scanned);
        const match = url.pathname.match(/\/containers\/([^/]+)$/);
        if (match) {
          navigate(`/containers/${match[1]}`);
          return;
        }
      } catch {
        // Not a valid URL — fall through to API lookup by raw qrCode field
      }

      const container = await api.get<Container>(`/containers/by-qr/${encodeURIComponent(scanned)}`);
      navigate(`/containers/${container.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.statusCode === 404
          ? t('scan.notFound')
          : t('common.error');
      setError(msg);
      setScanning(true);
    }
  }

  return (
    <Layout title={t('scan.title')} showBack>
      <div className={styles.scanContainer}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.viewfinder}>
          <video
            ref={videoRef}
            className={styles.video}
            muted
            playsInline
            aria-label="Camera feed"
          />
          <canvas ref={canvasRef} className={styles.canvas} />
          <div className={styles.overlay}>
            <div className={styles.corner} />
          </div>
        </div>

        <p className={styles.hint}>Point at a container's QR code</p>
      </div>
    </Layout>
  );
}
