// components/UserProfileCard.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileCardProps {
  user: {
    userId?: number; // Make userId optional to match the API type
    username?: string;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
    role?: string;
  };
  onClose?: () => void;
}

const UserProfileCard = ({ user, onClose }: UserProfileCardProps) => {
  // Ensure we have at least a userId or some identifier
  if (!user.userId && !user.username) {
    return null; // Or render some fallback UI
  }

    const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  return (
    // <div className="absolute left-1/2 z-50 w-48 -translate-x-1/2 transform rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-dark-tertiary">
       <div className="absolute right-1/3 top-1/2 z-50 w-48 -translate-x-1/2 transform rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-dark-tertiary">


      <div className="flex flex-col items-center">
        <Avatar className="h-16 w-16">
          {user.profilePictureUrl ? (
            <AvatarImage
                            src={buildImageUrl(user.profilePictureUrl)}
                            alt={`${user.firstname} ${user.lastname}`}
                          />
          ) : (
            <AvatarFallback className="text-lg">
              {user.firstname?.charAt(0)}
              {user.lastname?.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="mt-3 text-center">
          <h3 className="text-sm font-semibold dark:text-gray-300">
            {user.firstname || ''} {user.lastname || ''}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.role || "Team Member"}
          </p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-1 top-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default UserProfileCard;