
"use client";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from "firebase/storage";

/**
 * Uploads a profile image to Firebase Storage.
 * @param storage The Firebase Storage instance.
 * @param userId The user's ID.
 * @param file The image file to upload.
 * @returns A promise that resolves with the download URL of the uploaded image.
 */
export async function uploadProfileImage(
  storage: FirebaseStorage,
  userId: string,
  file: File
): Promise<string> {
  // Create a storage reference
  const storageRef = ref(storage, `profile-images/${userId}/${file.name}`);

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}
