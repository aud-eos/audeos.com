import { IconType } from "react-icons";
import {
  FaBandcamp,
  FaDropbox,
  FaGithub,
  FaInstagram,
  FaMixcloud,
  FaSoundcloud,
  FaSpotify,
  FaTiktok,
  FaTwitter,
  FaFacebook,
  FaYoutube,
} from "react-icons/fa";
import { FaSignalMessenger } from "react-icons/fa6";

export interface SocialLink {
  name: string;
  href: string;
  icon: IconType;
  title: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { name: "Instagram", href: "https://www.instagram.com/Audeos", icon: FaInstagram, title: "Follow DJ Audeos on Instagram" },
  { name: "SoundCloud", href: "https://soundcloud.com/audeos", icon: FaSoundcloud, title: "Listen DJ Audeos' music streaming on Soundcloud" },
  { name: "TikTok", href: "https://www.tiktok.com/@audeos1", icon: FaTiktok, title: "Follow Benny Audeos on TikTok!" },
  { name: "Spotify", href: "https://open.spotify.com/user/audeos?si=c4eec00475634694&nd=1&dlsi=09e968f5187346bd", icon: FaSpotify, title: "Follow Benny Audeos Playlists on Spotify" },
  { name: "YouTube", href: "https://www.youtube.com/@Audeos", icon: FaYoutube, title: "DJ Audeos Youtube Channel" },
  { name: "Dropbox", href: "https://www.dropbox.com/home/Audeos", icon: FaDropbox, title: "Download free music from DJ Audeos on Dropbox" },
  { name: "Mixcloud", href: "https://www.mixcloud.com/AUDEOS/", icon: FaMixcloud, title: "Listen to DJ Mixes from Audeos on Mixcloud" },
  { name: "Bandcamp", href: "https://audeos.bandcamp.com/", icon: FaBandcamp, title: "Download music from DJ Audeos on Bandcamp" },
  { name: "X", href: "https://x.com/audeos", icon: FaTwitter, title: "Audeos on Twitter/X" },
  { name: "Facebook", href: "https://www.facebook.com/audeos", icon: FaFacebook, title: "DJ Audeos on Facebook" },
  { name: "GitHub", href: "https://github.com/aud-eos", icon: FaGithub, title: "Audeos on Github" },
  { name: "Signal", href: "https://signal.me/#eu/3MmHJflqdOPIJ1J1ZNmOSseSN5oW3woaADHRKZxSnasvbFg0-x5OG4q97CUKt3Iy", icon: FaSignalMessenger, title: "Contact Benny on Signal" },
];

const LISTENING_ORDER = [ "SoundCloud", "Mixcloud", "Bandcamp", "Spotify", "YouTube", "Dropbox" ];

export const LISTENING_LINKS: SocialLink[] = LISTENING_ORDER.map( name => {
  const link = SOCIAL_LINKS.find( socialLink => socialLink.name === name );
  if( !link ) throw new Error( `LISTENING_LINKS: no social link named "${name}"` );
  return link;
});
