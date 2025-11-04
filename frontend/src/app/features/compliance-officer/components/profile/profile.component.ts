import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ComplianceService, OfficerDetailsResponse, OfficerPersonalDetailsResponse, OfficerProfileResponse } from '../../../../core/services/compliance.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-compliance-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);

  isLoading = signal(true);
  isUploading = signal(false);
  profile = signal<OfficerProfileResponse | null>(null);
  activeTab = signal<'ABOUT' | 'WORK'>('ABOUT');

  currentUser = this.authService.currentUser;
  userEmail = computed(() => this.currentUser()?.email || 'N/A');
  userRole = computed(() => this.authService.userRole());

  officerName = computed(() => {
    const d = this.profile()?.details;
    if (d?.firstName || d?.lastName) {
      return `${d.firstName || ''} ${d.lastName || ''}`.trim();
    }
    return this.currentUser()?.email?.split('@')[0] || 'Officer';
  });

  profilePhotoUrl = computed(() => {
    return this.profile()?.personal?.profilePhotoUrl || null;
  });

  officerInitials = computed(() => {
    const name = this.officerName();
    if (name && name.length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    return 'O';
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.complianceService.getOfficerProfile().subscribe({
      next: (data) => { this.profile.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  setTab(tab: 'ABOUT' | 'WORK'): void {
    this.activeTab.set(tab);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Invalid File', 'Please select an image file');
        return;
      }
      
      // Validate file size (2MB max)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        this.notificationService.error('File Too Large', 'Profile photo must be less than 2MB');
        return;
      }
      
      this.uploadPhoto(file);
    }
  }

  uploadPhoto(file: File): void {
    this.isUploading.set(true);
    this.complianceService.uploadProfilePhoto(file).subscribe({
      next: (photoUrl) => {
        // Update profile with new photo URL
        const currentProfile = this.profile();
        if (currentProfile && currentProfile.personal) {
          currentProfile.personal.profilePhotoUrl = photoUrl;
          this.profile.set({ ...currentProfile });
        }
        this.isUploading.set(false);
        this.notificationService.success('Success', 'Profile photo uploaded successfully');
      },
      error: (error) => {
        this.isUploading.set(false);
        this.notificationService.error('Upload Failed', error.message || 'Failed to upload profile photo');
      }
    });
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('profile-photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
}


