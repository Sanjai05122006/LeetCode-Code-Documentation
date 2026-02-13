# Trionic Array I

**Problem Link:** https://leetcode.com/problems/trionic-array-i/

**Language:** Java

**Topics:** Array

---

```java
class Solution {
    public boolean isTrionic(int[] nums) {
        int i=0;
        int p=-1;
        int q=-1;
        int n=nums.length-1;
        while(i<n){
            if(nums[i]>nums[i+1]){
                p=i;
                break;
            }
            else if(nums[i]==nums[i+1]){
                return false;
            }
            i++;
        }
        if(p<=0){
            return false;
        }
        while(i<n){
            if(nums[i]<nums[i+1]){
                q=i;
                break;
            }
            else if(nums[i]==nums[i+1]){
                return false;
            }
            i++;
        }
        if(q<=p){
            return false;
        }
        while(i<n){
            if(nums[i]<nums[i+1]){
                i++;
            }

            else{
                return false;
            }
            
        }
        return true;
    }
}
```
