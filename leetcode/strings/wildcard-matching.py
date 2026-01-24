class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        i = j = 0
        m, n = len(s), len(p)
        star_idx = -1
        match = 0
        
        while i < m:

            if j < n and (p[j] == '?' or p[j] == s[i]):
                i += 1
                j += 1

            elif j < n and p[j] == '*':
                star_idx = j
                match = i
                j += 1
 
            elif star_idx != -1:
                j = star_idx + 1
                match += 1
                i = match

            else:
                return False
        
       
        while j < n and p[j] == '*':
            j += 1
        
        return j == n