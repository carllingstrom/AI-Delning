interface SimpleWordcloudProps {
  words: Array<{ text: string; value: number }>;
}

export default function SimpleWordcloud({ words }: SimpleWordcloudProps) {
  return (
    <div className="bg-[#121F2B] p-4 rounded-lg">
      <div className="flex flex-wrap gap-2">
        {words.slice(0, 10).map((word, index) => (
          <span
            key={index}
            className="px-3 py-1 rounded-full text-[#fffefa]"
            style={{
              fontSize: `${Math.max(12, Math.min(24, 12 + word.value * 2))}px`,
              backgroundColor: `hsl(${index * 36}, 70%, 50%)`,
            }}
          >
            {word.text}
          </span>
        ))}
      </div>
      <div className="text-sm text-gray-400 mt-2">
        Showing top {Math.min(10, words.length)} qualitative effects
      </div>
    </div>
  );
} 