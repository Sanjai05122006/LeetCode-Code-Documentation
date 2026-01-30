import java.util.HashMap;
class Solution {
    public int romanToInt(String s) {
        HashMap<String,Integer> ans=new HashMap<>();
        ans.put("I",1);
        ans.put("V",5);
        ans.put("X",10);
        ans.put("L",50);
        ans.put("C",100);
        ans.put("D",500);
        ans.put("M",1000);
        ans.put("IV",4);
        ans.put("IX",9);
        ans.put("XL",40);
        ans.put("XC",90);
        ans.put("CD",400);
        ans.put("CM",900);
        
        
        int count=0;
        
        for(int i=0;i<s.length();i++){
            if( i<s.length()-1 && (s.substring(i,i+2).equalsIgnoreCase("IV") ||
                s.substring(i,i+2).equalsIgnoreCase("IX") ||
                s.substring(i,i+2).equalsIgnoreCase("XL") ||
                s.substring(i,i+2).equalsIgnoreCase("XC") ||
                s.substring(i,i+2).equalsIgnoreCase("CD") ||
                s.substring(i,i+2).equalsIgnoreCase("CM") 
                )){
                count=count+ans.get(s.substring(i,i+2));
                i++;
                
            }
            else{
                count=count+ans.get(s.substring(i,i+1));
          
            }
        }
        
        return count;
    }
}