import { Injectable } from '@angular/core';

/**
 * Service to encode/decode IDs for secure URLs
 * Uses Base64 URL-safe encoding to hide UUIDs and make URLs secure
 */
@Injectable({
  providedIn: 'root'
})
export class IdEncoderService {
  
  /**
   * Encode UUID to Base64 URL-safe string
   * @param uuid The UUID string to encode
   * @returns Encoded string safe for URLs
   */
  encodeId(uuid: string): string {
    if (!uuid) return '';
    
    try {
      // Remove hyphens from UUID
      const uuidWithoutHyphens = uuid.replace(/-/g, '');
      
      // Convert hex string to bytes
      const bytes = this.hexToBytes(uuidWithoutHyphens);
      
      // Encode to Base64 and make URL-safe
      const base64 = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return base64;
    } catch (error) {
      console.error('Error encoding ID:', error);
      return uuid; // Fallback to original UUID if encoding fails
    }
  }

  /**
   * Decode Base64 URL-safe string back to UUID
   * @param encoded The encoded string from URL
   * @returns Original UUID string
   */
  decodeId(encoded: string): string {
    if (!encoded) return '';
    
    try {
      // Make Base64 URL-safe format standard
      const base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      
      // Decode from Base64
      const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
      
      // Convert bytes to hex string
      const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Format as UUID
      const uuid = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
      
      return uuid;
    } catch (error) {
      console.error('Error decoding ID:', error);
      // Try to use as-is if it looks like a UUID
      if (encoded.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return encoded;
      }
      return '';
    }
  }

  /**
   * Convert hex string to byte array
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}

