# Merge Strings Alternately

**Problem Link:** https://leetcode.com/problems/merge-strings-alternately/

**Language:** Java

**Topics:** Two Pointers, String

---

```java
class Solution {
    public String mergeAlternately(String word1, String word2) {
        StringBuilder merged = new StringBuilder();
        int maxLength = Math.max(word1.length(), word2.length());

        for (int i = 0; i < maxLength; i++) {
            if (i < word1.length()) {
                merged.append(word1.charAt(i));
            }
            if (i < word2.length()) {
                merged.append(word2.charAt(i));
            }
        }

        return merged.toString();        
    }
}
```
